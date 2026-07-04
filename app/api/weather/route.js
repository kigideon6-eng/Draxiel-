export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');
  const lga = searchParams.get('lga');

  if (!process.env.WEATHER_API_KEY) {
    return Response.json(
      { error: 'WEATHER_API_KEY is not set on the server.' },
      { status: 500 }
    );
  }

  try {
    const query = encodeURIComponent(`${lga},NG`);
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${process.env.WEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();

    let lat, lon;
    if (geoData && geoData[0]) {
      lat = geoData[0].lat;
      lon = geoData[0].lon;
    } else {
      const stateQuery = encodeURIComponent(`${state},NG`);
      const stateGeoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${stateQuery}&limit=1&appid=${process.env.WEATHER_API_KEY}`
      );
      const stateGeoData = await stateGeoRes.json();
      if (!stateGeoData || !stateGeoData[0]) {
        return Response.json({ error: 'Location not found.' }, { status: 404 });
      }
      lat = stateGeoData[0].lat;
      lon = stateGeoData[0].lon;
    }

    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.WEATHER_API_KEY}`
    );
    const weatherData = await weatherRes.json();

    return Response.json({
      temperature: weatherData.main?.temp,
      humidity: weatherData.main?.humidity,
      windSpeed: weatherData.wind?.speed,
      description: weatherData.weather?.[0]?.description || 'No description available',
      rainChance: weatherData.rain ? `${weatherData.rain['1h'] || 0}mm/hr` : '0mm/hr',
    });
  } catch (err) {
    return Response.json({ error: 'Could not fetch weather right now.' }, { status: 500 });
  }
}
