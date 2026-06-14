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
    
    // Find Pizza Palace
    const restaurant = await Restaurant.findOne({ name: "Pizza Palace" });
    if (!restaurant) {
      console.log("Restaurant Pizza Palace not found.");
      return;
    }
    
    // Find the masala dose item
    const item = restaurant.menu.find(m => m.name.toLowerCase() === "masala dose" || m.name.toLowerCase() === "masala dosa");
    if (!item) {
      console.log("Menu item 'masala dose' not found.");
      return;
    }
    
    // Update the emoji field with a direct image link
    const directImageUrl = "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop";
    item.emoji = directImageUrl;
    
    await restaurant.save();
    console.log(`Successfully updated ${item.name} image URL to: ${directImageUrl}`);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
