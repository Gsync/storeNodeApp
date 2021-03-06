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
            const bounds = new google.maps.LatLngBounds(); //create map bounds
            const infoWindow = new google.maps.InfoWindow();//create info window
            const markers = places.map(place => {
                const [placelng, placelat] = place.location.coordinates;
                const position = { lat: placelat, lng: placelng };
                bounds.extend(position); //extend the bounds to position
                const marker = new google.maps.Marker({
                    map: map,
                    position: position
                });
                marker.place = place;
                return marker;
            });

            //Infowindow
            markers.forEach(marker => {
                marker.addListener('click', function() { //addListener is google's method like addEventListener
                const html = `
                    <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
                            <p>${this.place.name} - ${this.place.location.address}</p>
                        </a>    
                    </div>
                `    
                infoWindow.setContent(html);
                infoWindow.open(map, marker); //marker === this (marker can be replaced by this)
                })
            });

            //zoom the map to fit all the markers
            map.setCenter(bounds.getCenter()); //center
            map.fitBounds(bounds);  //zoom
        })
}

function makeMap(mapDiv) {
    if (!mapDiv) return ;
    //make our map
    const map = new google.maps.Map(mapDiv, mapOptions);
    const input = $('[name="geolocate"]'); //$ using bling to select the element
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
        console.log(place);
    });
    loadPlaces(map);
}

export default makeMap;