import { getDb } from "../db/connect.js";

export default async (req, res) => {
  const { tripId } = req.params;
  const db = getDb();
  const details = await db.collection("trips").findOne({ id: tripId });

  if (!details) {
    return res.status(404).render("errors/404", {
      title: "Trip Not Found",
      error: `Trip ${tripId} was not found.`,
    });
  }

  return res.render("trips/details", {
    title: "Trip Details",
    details,
  });
};
