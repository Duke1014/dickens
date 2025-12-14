import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";

export default function Cast() {

    // const [cast, setCast] = useState([]);

    // useEffect(() => {
    //     async function fetchCast() {
    //         const q = query(
    //             collection(db, "cast"),
    //             where("visible", "==", true),
    //             orderBy("sortOrder", "asc")
    //         )

    //         const snap = await getDocs(q)
    //         const list = snap.docs.map(doc => ({
    //             id: doc.id, ...doc.data()
    //         }))
    //         setCast(list)
    //     }

    //     fetchCast()
    // }, [])


    return (
        <div className="cast-gallery">
            {/* {cast.map(member => (
                <div className="cast-card" key={member.id}>
                <img src={member.headshotUrl} alt={member.characterName} />
                <h3>{member.characterName}</h3>
                <p>{member.actorName}</p>
                </div>
            ))} */}
        </div>
    )
}