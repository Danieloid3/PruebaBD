// javascript
// src/mongo/services/customerHistoryService.js
import { getDb } from '../connection.js';

export const upsertCustomerHistory = async (customerData) => {
    const db = getDb();
    const collection = db.collection('customers_history');

    await collection.updateOne(
        { customerId: customerData.customerId },
        { $set: customerData },
        { upsert: true }
    );

    console.log(
        `✅ Historial actualizado en Mongo para paciente ${customerData.customerId} ` +
        `(db: ${db.databaseName}, coll: ${collection.collectionName})`
    );
};

export const getAllCustomerHistories = async () => {
    const db = getDb();
    const collection = db.collection('customers_history');

    const docs = await collection.find({}).toArray();

    console.log(
        `📄 Leídos ${docs.length} historiales desde Mongo ` +
        `(db: ${db.databaseName}, coll: ${collection.collectionName})`
    );

    return docs;
};
