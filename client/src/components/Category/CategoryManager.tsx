import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../../services/api';

interface Category {
  _id?: string;
  name: string;
  description?: string;
  count?: number;
}

interface CategoryManagerProps {
  onCategoryChange?: () => void;
  inline?: boolean;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onCategoryChange, inline = false }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editData, setEditData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoriesAPI.getCategoriesWithStats();
      // 过滤掉"全部"分类
      const filteredCategories = response.categories.filter((cat: Category) => cat.name !== '全部');
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('加载分类失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    try {
      await categoriesAPI.createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });
      
      toast.success('分类创建成功');
      setNewCategory({ name: '', description: '' });
      setIsCreating(false);
      loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      toast.error(error.response?.data?.message || '创建分类失败');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      await categoriesAPI.updateCategory(id, {
        name: editData.name.trim(),
        description: editData.description.trim() || undefined
      });
      
      toast.success('分类更新成功');
      setEditingId(null);
      loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.response?.data?.message || '更新分类失败');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除分类"${name}"吗？`)) {
      return;
    }

    try {
      await categoriesAPI.deleteCategory(id);
      toast.success('分类删除成功');
      loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error.response?.data?.message || '删除分类失败');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category._id!);
    setEditData({
      name: category.name,
      description: category.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', description: '' });
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewCategory({ name: '', description: '' });
  };

  if (isLoading) {
    return <div className="flex justify-center py-4">加载中...</div>;
  }

  const containerClass = inline 
    ? "space-y-2" 
    : "bg-white rounded-lg shadow-md p-4";

  return (
    <div className={containerClass}>
      {!inline && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">分类管理</h3>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            添加分类
          </button>
        </div>
      )}

      {/* 创建新分类 */}
      {isCreating && (
        <div className="border border-orange-200 rounded-lg p-3 bg-orange-50 mb-3">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="分类名称"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="分类描述（可选）"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelCreate}
                className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                <X className="h-3 w-3 mr-1" />
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
              >
                <Save className="h-3 w-3 mr-1" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分类列表 */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category._id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            {editingId === category._id ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <input
                  type="text"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="分类描述（可选）"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    <X className="h-3 w-3 mr-1" />
                    取消
                  </button>
                  <button
                    onClick={() => handleEdit(category._id!)}
                    className="flex items-center px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-gray-500">{category.description}</div>
                  )}
                  {category.count !== undefined && (
                    <div className="text-xs text-gray-400">{category.count} 个视频</div>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => startEdit(category)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="编辑分类"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id!, category.name)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="删除分类"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {inline && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mt-2 px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors text-sm"
        >
          <Plus className="h-4 w-4 inline mr-1" />
          添加新分类
        </button>
      )}
    </div>
  );
};

export default CategoryManager;