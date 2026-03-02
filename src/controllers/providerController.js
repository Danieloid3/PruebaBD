import * as providerService from '../services/providerService.js';

export const getAll = async (req, res) => {
    try {
        const providers = await providerService.getAll();
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getById = async (req, res) => {
    try {
        const provider = await providerService.getById(req.params.id);
        if (!provider) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(provider);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        const newProvider = await providerService.create(req.body);
        res.status(201).json(newProvider);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const updatedProvider = await providerService.update(req.params.id, req.body);
        if (!updatedProvider) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(updatedProvider);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req, res) => {
    try {
        const success = await providerService.remove(req.params.id);
        if (!success) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json({ message: 'Proveedor eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const stats = await providerService.getSupplierStats(req.params.id);
        if (!stats) return res.status(404).json({ message: 'Proveedor no encontrado' });
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSummary = async (req, res) => {
    try {
        const summary = await providerService.getSuppliersSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

