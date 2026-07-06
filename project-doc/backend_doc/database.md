# Database Structure

This document contains the information of the database structure.

## Tabels

### 1. Book

Name: **book** \
Fields:
1. id
2. title
3. author
4. isbn
5. summary (optional) - 500 char max (single paragraph)
6. tags (optional) - should be in lowercase, and no space no special character, no '-' and no '_'

### 2. BookCopy

Name: **bookcopy** \
Fields:
1. id
2. book_id (FK)
3. is_available
4. condition

### 3. BookRelation

Name: **bookrelation** \
Fields:
1. id
2. book_id
3. related_book_id (array)

### 4. Member

Name: **member** \
Fields:
1. id
2. first_name
3. last_name
4. email
5. phone_number
6. address (optional)
7. membership_status
8. join_date
9. last_activity_date
10. total_loan_count - # A simple counter that can be incremented whenever a loan is created

### 5. Loan

Name: **loan** \
Field:
1. id
2. book_id (fk)
3. member_id (fk)
4. load_date
5. return_date

## Relationship between tables

- `book` to `loan`: One-to-Many. A single book can be loaned out multiple times over its lifetime, but only one "active" loan at a time.
- `member` to `loan`: One-to-Many. A member can have multiple historical loan records.
- `book` to `bookcopy`: one to many.
- `book` to `bookrelation`: one to many.
