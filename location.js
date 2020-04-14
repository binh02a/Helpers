const _ = require('lodash');
const axios = require('axios');
const fs = require('fs');

const apiKey = '<API key>';
const searchedPlaces = [
    'HCMC, dist 1',
    'HCMC, dist 2',
    'HCMC, dist 3',
    'HCMC, dist 4',
    'HCMC, dist 5',
    'HCMC, dist 6',
    'HCMC, dist 7',
    'HCMC, dist 8',
    'Dong Nai',
    'Long An',
    'Tien Giang',
    'Ishikawa',
];

const getLocations = () => {
    // get those that matched the searched places
    return Promise.all(searchedPlaces.map(place => {
        return axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
            params: {
                key: apiKey,
                input: place
            }
        })
            .then((res) => {
                return _.map((res.data || {}).predictions, 'place_id');
            });
    }))
        .then(_.flatten)
        .then(_.uniq)
        .then((ids) => Promise.all(ids.map((id) => {
            return axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                params: {
                    key: apiKey,
                    place_id: id
                }
            })
                .then((res) => {
                    // unwrap axios
                    res = (res.data || {}).result;
                    const area = (_.find(res.address_components, (component) => {
                        return (component.types || []).includes('administrative_area_level_1')
                    }) || {}).long_name;

                    if (!area) {
                        // ignore those without administrative_area_level_1
                        return undefined;
                    }

                    return {
                        address: res.formatted_address,
                        location: _.get(res, 'geometry.location'),
                        area,
                    }
                });
        })))
        .then(_.flatten)
        .then(_.compact);
};

return getLocations()
    .then((data) => {
        fs.writeFileSync('locations.json', JSON.stringify(data, null, 2));
    })
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.log(err);

        process.exit(1);
    });
