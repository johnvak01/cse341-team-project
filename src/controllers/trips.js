import {getAllTrips as findAllTrips, getTripById as findTripById} from "../models/trips.js";
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