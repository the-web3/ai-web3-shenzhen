import { Dispatch, SetStateAction, createContext, useContext, useEffect, useState } from "react";

type CategoryItem = {
  label: string;
  href: string;
};

type CategoryProviderProps = {
  children: React.ReactNode;
};

type ICategoryState = {
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  categories: Array<CategoryItem>;
  setCategories: Dispatch<SetStateAction<CategoryItem[]>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

export const CategoryContext = createContext<ICategoryState | null>(null);

export function useCategoryContext() {
  return useContext(CategoryContext) as ICategoryState;
}

export const CategoryProvider = ({ children }: CategoryProviderProps) => {
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<Array<CategoryItem>>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // 使用静态数据替代 API 调用
      const staticCategories: CategoryItem[] = [
        { label: "Home 首页", href: "/" },
        { label: "Dataset Gallery 数据集展览馆", href: "/dataset-gallery" },
        { label: "License Gallery 许可证展览馆", href: "/license-gallery" },
        { label: "Contract Interactor 合约交互", href: "/debug/BodhiBasedCopyright" },
        { label: "Twitter", href: "https://twitter.com/0xleeduckgo" },
      ];
      // const allCategory: CategoryItem = { label: "All 全部", href: "/" };
      // const categoriesArray = [allCategory, ...staticCategories];
      setCategories(staticCategories);
    } catch (error) {
      console.error("加载类别时出错:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ category, setCategory, categories, setCategories, loading, setLoading }}>
      {children}
    </CategoryContext.Provider>
  );
};
