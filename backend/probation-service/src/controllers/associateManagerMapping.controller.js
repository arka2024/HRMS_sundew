import {
  createAssociateManagerMapping,
  findAllAssociateManagerMappings,
  findAssociateManagerMappingById,
  updateAssociateManagerMapping,
  deleteAssociateManagerMapping,
  deactivateMapping,
} from '../repositories/associateManagerMapping.repository.js';

export async function createAssociateManagerMappingController(req, res) {
  try {
    const data = req.body;
    const mapping = await createAssociateManagerMapping(data);
    res.json({ message: 'Associate manager mapping created', mapping });
  } catch (error) {
    console.error('Create associate manager mapping error:', error);
    res.status(500).json({ error: error.message || 'Failed to create associate manager mapping' });
  }
}

export async function getAssociateManagerMappingsController(req, res) {
  try {
    const filters = req.query;
    const mappings = await findAllAssociateManagerMappings(filters);
    res.json({ mappings });
  } catch (error) {
    console.error('Get associate manager mappings error:', error);
    res.status(500).json({ error: 'Failed to get associate manager mappings' });
  }
}

export async function getAssociateManagerMappingByIdController(req, res) {
  try {
    const { id } = req.params;
    const mapping = await findAssociateManagerMappingById(id);
    if (!mapping) {
      return res.status(404).json({ error: 'Associate manager mapping not found' });
    }
    res.json({ mapping });
  } catch (error) {
    console.error('Get associate manager mapping by id error:', error);
    res.status(500).json({ error: 'Failed to get associate manager mapping' });
  }
}

export async function updateAssociateManagerMappingController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const mapping = await updateAssociateManagerMapping(id, data);
    res.json({ message: 'Associate manager mapping updated', mapping });
  } catch (error) {
    console.error('Update associate manager mapping error:', error);
    res.status(500).json({ error: error.message || 'Failed to update associate manager mapping' });
  }
}

export async function deactivateAssociateManagerMappingController(req, res) {
  try {
    const { id } = req.params;
    const mapping = await deactivateMapping(id);
    res.json({ message: 'Associate manager mapping deactivated', mapping });
  } catch (error) {
    console.error('Deactivate associate manager mapping error:', error);
    res.status(500).json({ error: 'Failed to deactivate associate manager mapping' });
  }
}

export async function deleteAssociateManagerMappingController(req, res) {
  try {
    const { id } = req.params;
    await deleteAssociateManagerMapping(id);
    res.json({ message: 'Associate manager mapping deleted' });
  } catch (error) {
    console.error('Delete associate manager mapping error:', error);
    res.status(500).json({ error: 'Failed to delete associate manager mapping' });
  }
}
