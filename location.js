const _ = require('lodash');
const axios = require('axios');
const fs = require('fs');

const apiKey = 'AIzaSyA1mKlaPbS9feVEdR2tHqRvtjepS6OGnI4';
const searchedPlaces = [
  'Ho chi minh District 1',
  'Ho chi minh District 2',
  'Ho chi minh District 3',
  'Ho chi minh District 4',
  'Ho chi minh District 5',
  'Ho chi minh District 6',
  'Ho chi minh District 7',
  'Ho chi minh District 8',
  'Ho chi minh District 9',
  'Ho chi minh District 10',
  'District 12',
  'Ho chi minh Ho chi minh District 11',
  'Ho chi minh Gò Vấp',
  'Ho chi minh Tân Bình',
  'Ho chi minh Tân Phú',
  'Ho chi minh Bình Thạnh',
  'Ho chi minh Phú Nhuận',
  'Ho chi minh Bình Tân',
  'Ho chi minh Thủ Đức',
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

          return {
            address: res.formatted_address,
            longitude: _.get(res, 'geometry.location.lng'),
            latitude: _.get(res, 'geometry.location.lat'),
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
