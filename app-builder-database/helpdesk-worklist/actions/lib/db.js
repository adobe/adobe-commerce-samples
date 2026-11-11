const TICKETS_COLLECTION = 'helpdesk_tickets'

// The deploy hook applies this schema; ABDB enforces it on inserts and updates.
const TICKET_COLLECTION_OPTIONS = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'status', 'priority', 'createdAt'],
      properties: {
        _id: { bsonType: 'string', minLength: 1 },
        title: { bsonType: 'string', pattern: '\\S' },
        status: { enum: ['open', 'claimed', 'closed'] },
        priority: { enum: [1, 2, 3] },
        createdAt: { bsonType: 'date' },
        assigneeId: { bsonType: ['string', 'null'] },
        claimedAt: { bsonType: ['date', 'null'] },
        description: { bsonType: 'string' }
      }
    }
  }
}

// Partial index: only open tickets are indexed by priority and creation time.
const TICKETS_INDEXES = [{
  key: { priority: 1, createdAt: 1 },
  options: {
    name: 'open_priority_createdAt',
    partialFilterExpression: { status: 'open' }
  }
}]

module.exports = {
  TICKETS_COLLECTION,
  TICKET_COLLECTION_OPTIONS,
  TICKETS_INDEXES,
}
