const express = require( 'express' )
const app = express()
const axios = require( 'axios' )
// url

app.use( express.json() );
app.use( express.urlencoded() );



// loop over keys (not used)
function loopOverKeys( Obj, query ) {
    Object.keys( Obj ).forEach( ( key ) => {
        if ( !query.trim() ) {
            query = `${ key }=${ Obj[key] }`
        } else {
            query = `${ query }&${ key }=${ Obj[key] }`
        }
    } );

    return query;
};

//for changet field name
function updateKeys ( key ) { //not "depature"
    return {
        "origin": "fly_from",
        "destination": "fly_to",
        "currency": "curr",
        "country": "country",
        "adults": "adults",
        "children": "children",
        "infants": "infants",
        "language": "locale",
        "tripType": "flight_type",
        "cabinClass": "selected_cabins",
    }[key];
};

//for class name to char
function convertCabinClass ( cabinClass ) { //not "depature"
    return {
        "economy": "M",
        "economy premium": "W",
        "business": "C",
        "first class": "F",
    }[cabinClass.toLowerCase().trim()];
};


//for legs conversion
function convertLegs( query,legs,tripType ) {
    Object.keys( legs[0] ).forEach( ( key ) => {
        if ( !query.trim() ) {
            query = `${ updateKeys(key) }=${ legs[0][key] }`
        } else {
            if ( key === 'departure' ) {
                query = `${ query }&date_from=${ legs[0]['departure'] }&date_to=${ legs[0]['departure'] }`
            } else {
                query = `${ query }&${ updateKeys(key) }=${ legs[0][key] }`
            }
        }
    } );

    if ( tripType.trim() === "round" ) {
        query = `${ query }&return_from=${ legs[1]['departure'] }&return_to=${ legs[1]['departure'] }`
    }

    return query;
}


function getReadyQuery ( bodyContent,query='' ) {
    Object.keys( bodyContent ).forEach( ( key ) => {
        //first prepare logs
        if ( key.trim() === 'legs' ) {
            query = convertLegs( query, bodyContent['legs'], bodyContent['tripType'] );

        } else if ( key.trim() === 'cabinClass' ) {
            //prepare cabins
            if ( !query.trim() ) {
                query = `${ updateKeys(key) }=${ convertCabinClass(bodyContent[key]) }`
            } else {
                query = `${ query }&${ updateKeys(key) }=${ convertCabinClass(bodyContent[key]) }`
            }
            
        } else if (key.trim()=== 'visitorId'||key.trim()=== 'country'||key.trim() === 'passengers') {
            //ignore fields (visitorid, passengers)
            query = query;
            
        }
        else {
            //prepare other fields
            if ( !query.trim() ) {
                query = `${ updateKeys(key) }=${ bodyContent[key] }`
            } else {
                query = `${ query }&${ updateKeys(key) }=${ bodyContent[key] }`
            }

        }
    } );
    
    console.log( 'query', query );
    return query;
}


app.get( '/search', async ( req, res, next ) => {
    let query = '';
    query= getReadyQuery(req.body,query)
    
    const {
        data
    } = await axios.get( `https://tequila-api.kiwi.com/v2/search?${query}`, {
        headers: {
            apikey: "m8dcJMH9DzC6E9GTTdNgtlA8Wu9bp9li"
        },
    } );
    res.status( 200 ).json( {
        status: 'success',
        data
    } )
} )


app.listen( 5000, () => {
    console.log( 'server running on port 5000' )
} )
