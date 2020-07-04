const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.static("build"));

app.use(cors());

morgan.token("postPerson", function (req, res) {
  return JSON.stringify(req.body);
});

morgan.format(
  "person",
  ":method :url :status :res[content-length] - :response-time ms :postPerson"
);

app.use(
  morgan("person", {
    skip: function (req, res) {
      return req.method !== "POST";
    },
  })
);

app.use(
  morgan("tiny", {
    skip: function (req, res) {
      return req.method === "POST";
    },
  })
);

let persons = [
  {
    name: "Arto Hellas",
    number: "040-123456",
    id: 1,
  },
  {
    name: "Dan Abramov",
    number: "12-43-234345",
    id: 3,
  },
];

app.get("/info", (req, res) => {
  res.send(
    "<p>Phonebook has info for " +
      persons.length +
      " people</p>" +
      "<p>" +
      new Date() +
      "</p>"
  );
});

app.get("/api/persons", (req, res) => {
  res.json(persons);
});

app.get("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  const person = persons.find((person) => person.id === id);
  if (person) {
    response.json(person);
  } else {
    response.status(404).end();
  }
});

app.delete("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  persons = persons.filter((person) => person.id !== id);

  response.status(204).end();
});

const generateId = () => {
  const id = Math.floor(Math.random() * 10000);
  return id;
};

app.post("/api/persons", (request, response) => {
  const body = request.body;

  if (!body.name) {
    return response.status(400).json({
      error: "name missing",
    });
  }
  if (!body.number) {
    return response.status(400).json({
      error: "number missing",
    });
  }
  if (persons.map((person) => person.name).includes(body.name)) {
    return response.status(400).json({
      error: "name must be unique",
    });
  }

  const person = {
    name: body.name,
    number: body.number,
    id: generateId(),
  };

  persons = persons.concat(person);

  response.json(person);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
