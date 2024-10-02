import { Route, Routes } from "react-router-dom"
// import RouteContainer from "../../components/extensions/route-container"
// import { useRoutes } from "../../providers/route-provider"

import ProductCategoryIndex from "./pages"

const ProductCategories = () => {
//   const { getNestedRoutes } = useRoutes()

//   const nestedRoutes = getNestedRoutes("/product-categories")

  return (
    <ProductCategoryIndex />
  )
}

export default ProductCategories
