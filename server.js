const express = require("express")
const { MongoClient, ObjectId } = require("mongodb")
const cors = require("cors")
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()
const PORT = process.env.PORT || 3000

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://yarkinovweb:NHOTt50v0Odu149h@cluster0.eyngkp4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

let db

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then((client) => {
    console.log("MongoDB ga ulandi")
    db = client.db("ecommerce")
    initializeSampleData()
  })
  .catch((error) => {
    console.error("MongoDB ga ulanishda xatolik:", error)
    process.exit(1)
  })

async function initializeSampleData() {
  try {
    const productCount = await db.collection("products").countDocuments()

    if (productCount === 0) {
      const sampleProducts = [
        {
          name: "Aqlli Soat",
          description: "Sog'liqni saqlash monitoringi bilan jihozlangan aqlli soat",
          price: 99.99,
          category: "electronics",
          image: "/placeholder.svg?height=200&width=280",
          stock: 50,
          rating: 4.5,
          createdAt: new Date(),
        },
        {
          name: "Paxtali futbolka",
          description: "100% paxtadan tayyorlangan qulay futbolka",
          price: 19.99,
          category: "clothing",
          image: "/placeholder.svg?height=200&width=280",
          stock: 100,
          rating: 4.2,
          createdAt: new Date(),
        },
        {
          name: "Dasturlash haqida kitob",
          description: "Learn modern web development",
          price: 39.99,
          category: "books",
          image: "/placeholder.svg?height=200&width=280",
          stock: 25,
          rating: 4.8,
          createdAt: new Date(),
        },
        {
          name: "Ro'zg'or anjomlari to'plami",
          description: "Asosiy bog' vositalarining to'liq to'plami",
          price: 79.99,
          category: "home",
          image: "/placeholder.svg?height=200&width=280",
          stock: 15,
          rating: 4.4,
          createdAt: new Date(),
        },
        {
          name: "Macbook Pro M1 Pro",
          description: "Dasturlash va ofis uchun",
          price: 1500.99,
          category: "home",
          image: "/placeholder.svg?height=200&width=280",
          stock: 15,
          rating: 4.4,
          createdAt: new Date(),
        },
      ]

      await db.collection("products").insertMany(sampleProducts)
      console.log("Mahsulot namunalari kiritildi")
    }
  } catch (error) {
    console.error("Namuna maʼlumotlarini ishga tushirishda xatolik yuz berdi:", error)
  }
}

app.get("/api/products", async (req, res) => {
  try {
    const products = await db.collection("products").find({}).toArray()
    res.json(products)
  } catch (error) {
    console.error("Mahsulotlarni olishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db.collection("products").findOne({ _id: new ObjectId(req.params.id) })
    if (!product) {
      return res.status(404).json({ error: "Mahsulot topilmadi" })
    }
    res.json(product)
  } catch (error) {
    console.error("Mahsulotni olishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.userId,
      orderId: generateOrderId(),
      status: "pending",
      orderDate: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("orders").insertOne(orderData)

    for (const item of req.body.items) {
      await db
        .collection("products")
        .updateOne({ _id: new ObjectId(item.productId) }, { $inc: { stock: -item.quantity } })
    }

    res.json({
      success: true,
      orderId: orderData.orderId,
      _id: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/orders/:orderId/track", async (req, res) => {
  try {
    const order = await db.collection("orders").findOne({ orderId: req.params.orderId })
    if (!order) {
      return res.status(404).json({ error: "Buyurtma topilmadi" })
    }

    res.json({
      orderId: order.orderId,
      status: order.status,
      orderDate: order.orderDate,
      total: order.total,
      items: order.items,
    })
  } catch (error) {
    console.error("Buyurtmani kuzatishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/support", async (req, res) => {
  try {
    const supportData = {
      ...req.body,
      createdAt: new Date(),
      status: "open",
    }

    await db.collection("support").insertOne(supportData)
    res.json({ success: true })
  } catch (error) {
    console.error("Qo'llash xabarini yuborishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Bu pochta orqali foydalanuvchi allaqachon mavjud" })
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("users").insertOne(userData)

    res.json({
      success: true,
      message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi",
      userId: result.insertedId,
    })
  } catch (error) {
    console.error("Ro‘yxatdan o‘tish xatosi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body

    if (isAdmin) {
      const adminEmail = "admin@gmail.com"
      const adminPassword = "admin"

      if (email === adminEmail && password === adminPassword) {
        const adminUser = {
          _id: "admin",
          name: "Administrator",
          email: adminEmail,
          isAdmin: true,
        }

        const token = jwt.sign({ userId: "admin", isAdmin: true }, JWT_SECRET, { expiresIn: "24h" })

        res.json({
          success: true,
          user: adminUser,
          token,
        })
      } else {
        res.status(401).json({ error: "Administrator hisob ma’lumotlari noto‘g‘ri" })
      }
    } else {
      const user = await db.collection("users").findOne({ email })
      if (!user) {
        return res.status(401).json({ error: "Yaroqsiz elektron pochta yoki parol" })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({ error: "Yaroqsiz elektron pochta yoki parol" })
      }

      const token = jwt.sign({ userId: user._id, isAdmin: false }, JWT_SECRET, { expiresIn: "24h" })

      const { password: _, ...userWithoutPassword } = user

      res.json({
        success: true,
        user: userWithoutPassword,
        token,
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Kirish tokeni talab qilinadi" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token yaroqsiz yoki muddati oʻtgan" })
    }
    req.user = user
    next()
  })
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Administrator ruxsati talab qilinadi" })
  }
  next()
}


app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await db.collection("orders").find({}).sort({ orderDate: -1 }).toArray()
    res.json(orders)
  } catch (error) {
    console.error("Buyurtmalarni olishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    await db.collection("orders").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: status,
          updatedAt: new Date(),
        },
      },
    )
    res.json({ success: true })
  } catch (error) {
    console.error("Buyurtma holatini yangilashda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("products").insertOne(productData)
    res.json({ success: true, _id: result.insertedId })
  } catch (error) {
    console.error("Mahsulot qo‘shishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.put("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    }

    await db.collection("products").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData })
    res.json({ success: true })
  } catch (error) {
    console.error("Mahsulotni yangilashda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.delete("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ success: true })
  } catch (error) {
    console.error("Mahsulotni oʻchirishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/admin/analytics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalOrders = await db.collection("orders").countDocuments()
    const totalRevenue = await db
      .collection("orders")
      .aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }])
      .toArray()

    const topProducts = await db
      .collection("orders")
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ])
      .toArray()

    const recentOrders = await db.collection("orders").find({}).sort({ orderDate: -1 }).limit(10).toArray()

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      topProducts,
      recentOrders,
    })
  } catch (error) {
    console.error("Tahlilni olishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/admin/support", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messages = await db.collection("support").find({}).sort({ createdAt: -1 }).toArray()
    res.json(messages)
  } catch (error) {
    console.error("Qo'llash xabarlarini olishda xatolik yuz berdi:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"))
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

function generateOrderId() {
  return "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5).toUpperCase()
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Main site: http://localhost:${PORT}`)
  console.log(`Admin panel: http://localhost:${PORT}/admin`)
})
