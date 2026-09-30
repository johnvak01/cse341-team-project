import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true, 
        },
        region: {
            type: String,
            required: false,
            trim: true,
        },
        startStation: {
            type: String,
            required: true,
            trim: true,
        },
        endStation: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: String,
            required: true,
            trim: true,
        },
        distance: {
            type: Number,
            required: true,
            min: 0
        },
        highlights: {
            type: [String]
        },
        bestSeason: {
            type: String,
            required: false,
            trim: true,
        },
        operationMonths: {
            type: [Number]
        },
        imageUrl: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

/* 

Add a middleware to cascade the data being deleted. When a trip is deleted, 
the schedule that is referenced will automatically be deleted too so there is not
orphan data in the database/API 

*/

tripSchema.pre('deleteOne', {document:false, query:true}, async function(next){
    const query = this.getQuery(); //get the id from the function deleteTrip
    const tripId = query.id;

    if(tripId){
        await mongoose.model('Schedule').deleteMany({tripId: tripId});
    }
});


const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
