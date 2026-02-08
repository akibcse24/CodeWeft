export const DIAGRAM_TEMPLATES = {
    flowchart: `graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process 1]
  B -->|No| D[Process 2]
  C --> E[End]
  D --> E`,

    sequence: `sequenceDiagram
  participant Alice
  participant Bob
  Alice->>Bob: Hello Bob!
  Bob-->>Alice: Hi Alice!`,

    gantt: `gantt
  title Project Timeline
  dateFormat YYYY-MM-DD
  section Planning
  Task 1:         2024-01-01, 7d
  Task 2:         2024-01-08, 5d
  section Development
  Task 3:         2024-01-13, 10d`,

    classDiagram: `classDiagram
  class Animal {
    +String name
    +int age
    +makeSound()
  }
  class Dog {
    +bark()
  }
  Animal <|-- Dog`,

    erDiagram: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  PRODUCT ||--o{ LINE-ITEM : includes`,
};
