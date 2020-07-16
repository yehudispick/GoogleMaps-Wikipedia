/* global google, $*/

window.initMap = function(){
    'use strict';
    const input= $('#input');
    const rowsInput =$('#rows');
    const ul=$('#sidebar ul');    
    let current;
    let openSummary;
    const start = {lat:0, lng:0};

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(savePosition, noPosition)
    } else {
        console.log('Your browser does not support GeoLocation');
    }

    function noPosition() {
       alert("We can not obtain your current location");
    }

    function savePosition(position) {
       current = {lat: position.coords.latitude, long: position.coords.longitude};
    }

    function toRad(x) {
        return x * Math.PI / 180;
    }
    
    function calculateDistance(yourLat, yourLng, resultLat, resultLng){
        const R = 3961; 
        const rlat1 = toRad(yourLat);
        const rlat2 = toRad(resultLat);
        const dlat = toRad(resultLat-yourLat);
        const dlon= toRad(resultLng-yourLng);
        const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
                Math.cos(rlat1) * Math.cos(rlat2) *
                Math.sin(dlon/2) * Math.sin(dlon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    const map=new google.maps.Map(document.getElementById('map'), {
        center: start,
        zoom: 3,
        mapTypeId:google.maps.MapTypeId.SATELLITE
      });
      const infoWindow = new google.maps.InfoWindow();

      $('#inputForm').submit((e) => {
        e.preventDefault();
        
        $.getJSON(`http://api.geonames.org/wikipediaSearch?q=${input.val()}&maxRows=${rowsInput.val()}&username=yehudis&type=json&callback=?`)
        
        .done(results=>{
            const bounds = new google.maps.LatLngBounds();
            if(ul!==null){
                ul.empty();
            }
            results.geonames.forEach(result=> {
                const loc = { lat: result.lat, lng: result.lng };
                bounds.extend(loc);
               
                const marker = new google.maps.Marker({
                    position: loc,
                    map: map,
                    title: result.title,
                    icon: result.thumbnailImg ? {
                        url: result.thumbnailImg,
                        scaledSize: new google.maps.Size(50, 50)
                    } : null
                
                });

                marker.addListener('click', () => {
                    infoWindow.setContent(`
                        ${result.summary}
                        <br>
                        <a target="_blank" href="https://${result.wikipediaUrl}">more info</a>
                    `);
                    infoWindow.open(map, marker);
                    map.panTo(marker.getPosition());
                    map.setZoom(8);
                    });
                
                 let list=  $(`<li id='list'>
                    <img  id='image' src="${result.thumbnailImg || "google-earth.jpg"}"/>
                    <span id='title'>${result.title}</span>
                    <div class="summary"> ${result.summary}</div>
                    
                </li> `).appendTo(ul)
               .click(()=>{
                    const placeSummary = $(list.find('.summary'));
                    if (!placeSummary.is(openSummary)) {
                        map.fitBounds(bounds);
                        setTimeout(() => {
                            map.panTo(loc);
                            setTimeout(() => {
                                map.setZoom(18);
                            }, 500);
                        }, 500);
                        if (openSummary) {
                            openSummary.slideUp('slow');
                        }
                        placeSummary.slideDown('slow');

                        openSummary = placeSummary;
                    }
                });
                $('#sidebar').css('display', 'block');
                         
                let distance =$(` <div>
                     <button id ='distance'>Calculate Distance</button>
                     </div>`).appendTo(list)
                   .click(() =>{                                             
                        $(distance).remove();
                        let text;
                        if(!current){
                            text = "Sorry, your location is unavailabe";
                        }
                        else{
                            const d = calculateDistance(current.lat, current.long, result.lat, result.lng);
                            text = `${d.toFixed(2)} miles away`;
                        }
                        $(`<div id="miles"> ${text} </div>`).appendTo(list);
                    });
         });
      map.fitBounds(bounds);
    });
    
});
};