async function test() {

  const query = `
{
  Viewer {
    id
    name
  }
}
`;

  const res = await fetch(
    'https://graphql.anilist.co/graphql',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },

      body: JSON.stringify({
        query
      })
    }
  );

  const json = await res.json();

  console.log(json);
}

test();