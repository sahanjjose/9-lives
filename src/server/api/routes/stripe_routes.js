const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Process payment for vending machine purchase
router.post("/pay", async (req, res) => {
    try {
        const { amount } = req.body; // Only require amount from the request

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_data: {
              type: 'card',
              card: {
                token: 'tok_visa',
              },
            },
            return_url: 'https://example/return',
            description: "Test Payment using Visa test token with return_url",
            confirm: true, // Automatically confirm the PaymentIntent
          });

        // Check if the payment was successful
        const paymentStatus = paymentIntent.status === "succeeded";

        res.json({ success: paymentStatus, paymentIntent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
