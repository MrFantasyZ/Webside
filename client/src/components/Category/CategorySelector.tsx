import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../../services/api';

interface Category {
  _id?: string;
  name: string;
  description?: string;
}

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  error,
  placeholder = "请选择分类",
  required = false,
  name
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editData, setEditData] = useState({ name: '', description: '' });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoriesAPI.getCategories();
      setCategories(response.categories || []);
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
      const createdCategoryName = newCategory.name.trim();
      setNewCategory({ name: '', description: '' });
      setIsCreating(false);
      
      // 重新加载分类并选择新创建的分类
      await loadCategories();
      onChange(createdCategoryName);
      setIsOpen(false);
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
      
      // 如果当前选中的分类被编辑了，更新选中值
      const oldCategory = categories.find(cat => cat._id === id);
      if (oldCategory && value === oldCategory.name) {
        onChange(editData.name.trim());
      }
      
      loadCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.response?.data?.message || '更新分类失败');
    }
  };

  const handleDelete = async (id: string, categoryName: string) => {
    if (!window.confirm(`确定要删除分类"${categoryName}"吗？`)) {
      return;
    }

    try {
      await categoriesAPI.deleteCategory(id);
      toast.success('分类删除成功');
      
      // 如果删除的是当前选中的分类，清空选择
      if (value === categoryName) {
        onChange('');
      }
      
      loadCategories();
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

  const selectCategory = (categoryName: string) => {
    onChange(categoryName);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 选择器按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-orange-500' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">加载中...</div>
          ) : (
            <>
              {/* 现有分类列表 */}
              <div className="py-1">
                {categories.map((category) => (
                  <div key={category._id}>
                    {editingId === category._id ? (
                      // 编辑模式
                      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="分类名称"
                            onKeyPress={(e) => e.key === 'Enter' && handleEdit(category._id!)}
                          />
                          <input
                            type="text"
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            placeholder="分类描述（可选）"
                            onKeyPress={(e) => e.key === 'Enter' && handleEdit(category._id!)}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              <X className="h-3 w-3 mr-1" />
                              取消
                            </button>
                            <button
                              onClick={() => handleEdit(category._id!)}
                              className="flex items-center px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              保存
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 显示模式
                      <div className="flex items-center group hover:bg-gray-50">
                        <button
                          onClick={() => selectCategory(category.name)}
                          className={`flex-1 text-left px-3 py-2 text-sm ${
                            value === category.name ? 'bg-orange-50 text-orange-900' : 'text-gray-900'
                          }`}
                        >
                          <div>{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 truncate">{category.description}</div>
                          )}
                        </button>
                        
                        {/* 编辑和删除按钮 */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 px-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(category);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="编辑分类"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(category._id!, category.name);
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="删除分类"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 分隔线 */}
              {categories.length > 0 && <hr className="border-gray-200" />}

              {/* 创建新分类 */}
              {isCreating ? (
                <div className="px-3 py-3 bg-orange-50 border-t border-orange-200">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="分类名称"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="分类描述（可选）"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsCreating(false)}
                        className="flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-3 w-3 mr-1" />
                        取消
                      </button>
                      <button
                        onClick={handleCreate}
                        className="flex items-center px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        创建
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 border-t border-gray-200"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  创建新分类
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* 隐藏的input用于表单提交 */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}
    </div>
  );
};

export default CategorySelector;