import express from 'express';
import mysql from 'mysql'

const app = express()
app.use(express.json())
let db = null

const ConnectToDB = () => {
    try{
        db = mysql.createConnection({
            host:'localhost',
            user:'root',
            password:'1789',
            database:'education'
        })

        app.listen(3000, () => {
            console.log('Server is running on port 3000')
        })

    }catch(err){
        console.log(err)

    }
   

}

ConnectToDB()

const checkValidation = (req, res, next) => {
    const {name, address, latitude, longitude} = req.body
    if(!name || !address || !latitude || !longitude){
        res.status(400).send('All input is required')
    }
    else{
        next()
    }
}

app.post('/addSchool',checkValidation, async (req, res) => {
    const {name, address, latitude, longitude}  = req.body 
    const query = `INSERT INTO school ( name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;
    const values = [name, address, latitude, longitude];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error adding school');
        } else {
            res.send('School added successfully');
        }
    });
    
})


const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 
    return distance;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

app.get('/listSchools', (req, res) => {
    const { userLat, userLon } = req.query;

    const query = 'SELECT * FROM school';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Error getting schools');
        }

        if (userLat && userLon) {
            const schoolsWithDistance = results.map((school) => {
                const distance = getDistanceFromLatLonInKm(
                    parseFloat(userLat),
                    parseFloat(userLon),
                    parseFloat(school.latitude),
                    parseFloat(school.longitude)
                );
                return { ...school, distance };
            });

            schoolsWithDistance.sort((a, b) => a.distance - b.distance);

            res.json(schoolsWithDistance);
        } else {
            res.json(results);
        }
    });
});
