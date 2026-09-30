import mongoose from "mongoose";
import {getAllTrips as findAllTrips, getTripById as findTripById, updateTrip as changeTrip, deleteTrip as removeTrip} from "../models/trips.js";
import { getTripFilters } from "../models/trips.js";

//get all trips function needs to connect with db and return a status 200 for success and a status 500 for error with a safe message to user
export async function getAllTrips(req, res) {
    try{
        const trips = await findAllTrips ();
        
        return res.status(200).json(trips);
    }catch(error){
        console.error("Error fetching Trips:", error);

        return res.status(500).json({message: "Failed to fetch Trips"});
    }
}

/* get a trip by id function needs to connect with db and return a status 200 for success, 
a ststus 404 for not found id and a status 500 for unexpected error with a safe 
message to user
*/

export async function getTripById(req, res){
    try{
        const {id} = req.params;

        const trip = await findTripById(id);

        if(!trip){
            return res.status(404).json({message: "Trip not found"});
        }

        return res.status(200).json(trip);


    }catch(error){
        console.error("Error fetching trip:", error);

        return res.status(500).json({message:"Failed to fetch trip"});
    }
};

export async function getTripDetails (req, res) {
    const {tripId} = req.params;

    try{
        const details = await findTripById(tripId);

        if(!details){
            return res.status(404).render("errors/404", {
                title: "trip not found",
                error: `Trip ${tripId} was not found`
            });
        }

        return res.render("trips/details", {
            title: "Trip Details",
            details,
        });

    }catch(error){
        return res.status(500).render("error/500", {
            title: "Server Error",
            error: "An error occurred while fetching tri[ details"
        });
    }
};

export async function getTripsList (req, res) {
    try{
        const { regions, seasons } = await getTripFilters();

        res.render("trips/list", {
            title:"Scenic Train Trips",
            regions,
            seasons,
            query: req.query || {}
            
        });
    }catch(error) {
        console.error("Error setting up trips to list page:", error);
        res.status(500).render(error/500, {
            title: "server Error",
            error: "Failed to load the page layout"
        });
    }
}

/*
This function updates trip and schedule, allowing user to change trip name, trip station and trip schedule.

*/

export async function updateTrip (req, res) {
    try{
        const {id} = req.params;
        const updateData = req.body;

        //Make sure station does exist
        if(updateData.startStation || updateData.endStation){
            const stationModel = mongoose.model('Station');

            //throw error if the station doe not exist
            if(updateData.startStation){
                const startExist = await stationModel.findOne({name: updateData.startStation});
                if(!startExist){
                    return res.status(400).json({error:`Start Station '${updateData.startStation}' does not exist`});
                }
            }

            if(updateData.endStation){
                const endExist = await stationModel.findOne({name: updateData.endStation});
                if(!endExist){
                    return res.status(400).json({error:`End Station '${updateData.endStation}' does not exist`});
                }
            }
            
        }

        /*
        Make sure schedule exists and because the schedule don't exist inside the trip document and collection
        we need to check and update in the schedule collection
        */

        //grab collection
        if(updateData.scheduleId && Array.isArray(updateData.scheduleId)){
            const scheduleModel = mongoose.model('Schedule');

            //check schedule does exist
            const matchData = await scheduleModel.countDocuments({id: { $in: updateData.scheduleId}});
            if(matchData !== updateData.scheduleId.length){
                return res.status(400).json({error: 'Selected Schedule does not exist'});
            }

            //disconnect the trip from any older schedule it owns previously
            await scheduleModel.updateMany({tripId: id}, {$unset:{tripId:""}});

            //connect the newly choosen existing schedule to this trips id
            await scheduleModel.updateMany({id: {$in: updateData.scheduleId}}, {$set: {tripId:id}});

            //remove tripId from the playload so trip collection's document does not reject unknown field
            delete updateData.scheduleId;
        }

            // complete the trip update
            
        const result = await changeTrip(id, updateData);
        
        if(result.matchedCount === 0) {
            return res.status(400).json({error: `Trip with '${id}' not found`});
        }

        return res.status(200).json({message: "Trip and Schedule updated successfuly", wasModified: result.modifiedCount > 0 });
        

    }catch(error){
        return res.status(500).json({message: 'Internal server error'});
    }
}

export async function deleteTrip (id) {
    try{

        const {id} = req.params;

        const result = await removeTrip(id);

        //check if the request failed 
        if(result.deletedCount === 0){
            return res.status(404).json({error:`Trip with id '${id}' was not found`});
        }

        return res.status(200).json({message:"Trip and associated schedule were successfuly deleted"});

    }catch(error){
        return res.status(500).json({message:"Internal server error"})
    }
}