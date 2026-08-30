export const SAMPLE_CSV = `id,name,email,role,active,score,joined
1,Ada Lovelace,ada@example.com,Engineer,true,98.5,2023-01-15
2,Alan Turing,alan@example.com,Researcher,true,97.2,2023-02-20
3,Grace Hopper,grace@example.com,"Engineer, Lead",true,99.1,2023-03-05
4,Katherine Johnson,katherine@example.com,Analyst,false,95.8,2023-04-11
5,Margaret Hamilton,margaret@example.com,"Engineer
Software",true,99.9,2023-05-30`;

export const SAMPLE_JSON = `[
  {
    "id": 1,
    "name": "Ada Lovelace",
    "contact": { "email": "ada@example.com", "city": "London" },
    "skills": ["math", "computing"],
    "active": true
  },
  {
    "id": 2,
    "name": "Alan Turing",
    "contact": { "email": "alan@example.com", "city": "Wilmslow" },
    "skills": ["logic", "cryptanalysis"],
    "active": true
  },
  {
    "id": 3,
    "name": "Grace Hopper",
    "contact": { "email": "grace@example.com", "city": "New York" },
    "skills": ["compilers"],
    "active": false
  }
]`;
