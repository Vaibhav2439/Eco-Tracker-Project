const express = require("express");
const path = require("path");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Emission factors
const EMISSION_FACTORS = {
    travel: { car: 0.21, bus: 0.1, bike: 0.10, walk: 0 },
    energy: 0.5,
    food: 13,
    shopping: 0.05
};

const RECOMMENDATIONS = {
    travel: [
        "Use public transport, cycling, or walking for short distances.",
        "Choose direct flights whenever possible to reduce takeoff/landing emissions."
    ],
    energy: [
        "Switch to renewable sources like solar or wind power.",
        "Turn off appliances and lights when not in use."
    ],
    food: [
        "Reduce red meat consumption and prioritize plant-based meals.",
        "Avoid food waste by storing and planning meals properly."
    ],
    shopping: [
        "Buy durable products instead of fast fashion.",
        "Choose locally produced goods to reduce transportation emissions."
    ]
};

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/calculate", (req, res) => {
    const { travelType, distance, electricity, food, shopping } = req.body;

    // Convert to numbers
    const dist = parseFloat(distance);
    const elec = parseFloat(electricity);
    const foodVal = parseFloat(food);
    const shopVal = parseFloat(shopping);

    // Emission Factors
    const travelFactors = {
        car: 0.21,
        bus: 0.105,
        bike: 0.10,
        walk: 0
    };

    const travel = dist * travelFactors[travelType];
    const energy = elec * 0.233;
    const foodFoot = foodVal * 3.1;
    const shop = shopVal * 0.013;

    const totalFootprint = (travel + energy + foodFoot + shop).toFixed(2);

    // SEND ALL VARIABLES TO result.ejs
    res.render("result", {
        totalFootprint,
        travel: travel.toFixed(2),
        electricity: energy.toFixed(2),
        food: foodFoot.toFixed(2),
        shopping: shop.toFixed(2)
    });
});

app.get("/recommendations", (req, res) => {
    const fp = parseFloat(req.query.fp);

    let rec = [];

    if (fp < 10) {
        rec.push("Great job! Your carbon footprint is already low — keep using sustainable transport.");
        rec.push("Try switching to LED bulbs and maintaining energy-efficient habits.");
    } 
    else if (fp < 30) {
        rec.push("Consider using public transport 2–3 times a week instead of driving.");
        rec.push("Reduce meat intake by 20–30% to lower emissions.");
    } 
    else {
        rec.push("High footprint detected — consider shifting to a greener commute.");
        rec.push("Use energy-efficient appliances and track your electricity usage.");
        rec.push("Try a weekly vegetarian day to reduce food-related emissions.");
    }

    res.render("recommendations", { rec, fp });
});

app.get("/3dearth", (req, res) => {
    res.render("3dearth");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));