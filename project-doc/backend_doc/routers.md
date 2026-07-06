# API end point (routers) from Backend

This document contain the information about the all routing information and the API end point form the Library Management System - Backend.

## books.py

> Purpose: Book and Inventory Management

Responsibilities: CRUD on `Book` data, Managing `BookCopy` and Handling `BookRelation` link 

- Support Bulk operation: delete, create, update.

## members.py

> Purpose: Membership Management

Responsibilities: CRUD on `Members` and monitor member status

## loans.py

> Purpose: Loan Processing 

Responsibilities: Handling check-outs/check-ins (updating `Loan` table and `BookCopy` availability).

## ai_agent.py

> Purpose: AI Recommendations

Responsibilities: The endpoint for your `/api/chat` feature where the agent queries availability.

## admin.py

> Purpose: Administrative Tasks

Responsibilities: High-level management (e.g., stats, system monitoring, global settings)