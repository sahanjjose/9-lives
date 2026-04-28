require("dotenv").config();
const express = require("express");
const cors = require("cors");           // ← import cors
const app = express();
const port = process.env.PORT || 5000;

// enable CORS for your frontend origin (adjust if needed)
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost',
    'http://cs506x19.cs.wisc.edu'
  ],
  methods: ["GET","POST","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));
// also enable pre‑flight on all routes
app.options("*", cors());

app.use(express.json());

// Import routes
const vendingMachinesRoutes = require("./routes/vending_machine");
const itemsRoutes          = require("./routes/items");
const userRoutes           = require("./routes/users");
const orgRoutes            = require("./routes/orgs");
const stripeRoutes         = require("./routes/stripe_routes");
const mqttRoutes           = require("./routes/mqtt");

app.use("/vending-machines", vendingMachinesRoutes);
app.use("/items",           itemsRoutes);
app.use("/stripes",         stripeRoutes);
app.use("/users",           userRoutes);
app.use("/orgs",            orgRoutes);
app.use("/mqtt",            mqttRoutes);

console.log('Registered routes:');
app._router.stack
  .filter(layer => layer.route)
  .forEach(layer => {
    const methods = Object.keys(layer.route.methods)
      .map(m => m.toUpperCase())
      .join(', ');
    console.log(`${methods} ${layer.route.path}`);
  });

// Basic healthcheck endpoint for api
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
