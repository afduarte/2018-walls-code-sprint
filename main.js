const API_KEY = "YOUR API KEY"
const API_SECRET = "YOUR API SECRET"
const API = "https://wallscope.net/codesprint"

const n = window.N3.DataFactory.namedNode

const prefixes = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  hiccup: 'http://wallscope.co.uk/ontology/hiccup/',
  wallsNLP: 'http://wallscope.co.uk/ontology/nlp/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  dc: 'http://purl.org/dc/terms/',
  dbo: 'http://dbpedia.org/ontology/',
  geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  owl: 'http://www.w3.org/2002/07/owl#',
  schema: 'http://schema.org/',
  isds: 'http://wallscope.co.uk/ontology/isds/'
};

const RDFTYPE = n(prefixes.rdf + "type")
const WALLSREF = n(prefixes.wallsNLP + "reference")

let graph = window.N3.Store([], { prefixes });
const parser = new window.N3.Parser()

$(async () => {
  try {
    const { access_token } = await getToken()
    $.ajaxSetup({ headers: { 'Authorization': `Bearer ${access_token}`, 'Accept': 'application/n-triples' } });
    $("#submit").on('click', submitClick);
    $("#send-sparql").on('click', sparqlClick);
    $("body").on('click', '.ref', fetchEntity);
  } catch (e) {
    console.log(e)
  }
})

function getToken() {
  return $.ajax('https://wallscope.net/token?grant_type=client_credentials',
    {
      type: 'POST',
      data: '',
      headers: {
        Authorization: `Basic ${btoa(`${API_KEY}:${API_SECRET}`)}`
      }
    }
  ).promise()
}

async function submitClick(event) {
  try {
    event.preventDefault();

    const form = $('form#file')[0];

    const data = new FormData(form);

    const res = await $.ajax({
      type: "POST",
      enctype: 'multipart/form-data',
      url: `${API}/enhance/default`,
      data: data,
      processData: false,
      contentType: false,
      cache: false,
      timeout: 600000,
    }).promise();
    const quads = parser.parse(res)
    graph.addQuads(quads)

    const refs = graph.getQuads(null, WALLSREF, null)
    $('#refs').append("<h2>Entities</h2>")
    for (const { object } of refs) {
      $('#refs').append(`<div class="ref">${object.id}</div>`)
    }
  } catch (e) {
    console.log(e)
  }
}

async function fetchEntity(evt) {
  const clicked = $(this)
  const uri = clicked.text()
  const res = await $.ajax({
    type: "GET",
    url: `${API}/entity?id=${uri}`,
  }).promise();
  const quads = parser.parse(res)
  graph.addQuads(quads)
  const props = graph.getQuads(n(uri), null, null)
  const title = $('<h3/>', { text: uri })
  const elems = props.map(({ predicate, object }) => $('<p/>', { text: `${predicate.id} ==> ${object.id}` }))
  const container = $('<div/>', { class: 'entity' })
  container.append(title)
  container.append(elems)
  $('#entities').append(container)
}

async function sparqlClick(event) {
  try {
    event.preventDefault();
    const query = $('form#sparql textarea').val()
    const res = await $.get({
      type: "GET",
      headers:{
        Accept: 'text/html'
      },
      url: `https://wallscope.net/stat-store/sparql?query=${encodeURIComponent(query)}&format=text%2Fhtml`,
    }).promise();
    $('#sparql-results').html(res)
  } catch (e) {
    console.log(e)
  }
}