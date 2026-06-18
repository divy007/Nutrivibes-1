const mongoose = require("mongoose");
const clientSchema = new mongoose.Schema({ name: String, phone: String, mobile: String, referralRewards: Array, referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Client" }, referralStatus: String }, { strict: false });
const Client = mongoose.model("Client", clientSchema);

async function run() {
    require('dotenv').config({ path: '.env.local' });
    const uri = process.env.MONGODB_URI || "mongodb+srv://anujbhagat:nutrivibespwd@diet-planner-cluster.ngi67ji.mongodb.net/diet_planner?appName=Diet-Planner-Cluster";
    await mongoose.connect(uri);
    const client = await Client.findOne({ mobile: "9662056345" });
    console.log("CLIENT:", JSON.stringify(client, null, 2));
    const dugu = await Client.findOne({ name: "Dugu" });
    console.log("DUGU:", JSON.stringify(dugu, null, 2));
    await mongoose.disconnect();
}
run();
