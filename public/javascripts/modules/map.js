import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
    center: {
        lat: 43.2,
        lng: -79.8
    },
    zoom: 8,

}

function loadPlaces(map, lat=43.2, lng=-79.8) {
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            if (!places.length) return ;
            const markers = places.map(place => {
                const [placelng, placelat] = place.location.coordinates;
                const position = { lat: placelat, lng: placelng };
                const marker = new google.maps.Marker({
                    map: map,
                    position: position
                });
                marker.place = place;
                return marker;
            });
        })
}

function makeMap(mapDiv) {
    if (!mapDiv) return ;
    //make our map
    const map = new google.maps.Map(mapDiv, mapOptions);
    const input = $('[name="geolocate"]'); //$ using bling to select the element
    const autocomplete = new google.maps.places.Autocomplete(input);
    loadPlaces(map);
}

export default makeMap;