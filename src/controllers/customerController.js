import * as customerService from '../services/customerService.js';

export const getAll = async (req, res) => {
    try {
        const customers = await customerService.getAll();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const customer = await customerService.getById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Comprador no encontrado' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const newCustomer = await customerService.create(req.body);
        res.status(201).json(newCustomer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const updatedCustomer = await customerService.update(req.params.id, req.body);
        if (!updatedCustomer) return res.status(404).json({ message: 'Comprador no encontrado' });
        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const success = await customerService.remove(req.params.id);
        if (!success) return res.status(404).json({ message: 'Comprador no encontrado' });
        res.json({ message: 'Comprador eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
