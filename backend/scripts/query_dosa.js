import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const restaurantSchema = new mongoose.Schema({
  name: String,
  menu: [{
    name: String,
    price: Number,
    category: String,
    description: String,
    emoji: String,
  }]
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const restaurants = await Restaurant.find({});
    for (const r of restaurants) {
      console.log(`Restaurant: "${r.name}"`);
      for (const item of r.menu) {
        console.log(` - Item Name: "${item.name}" | Emoji field: "${item.emoji}"`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
