import { useAdminCollections, useAdminProductTypes, useAdminProductCategories } from "medusa-react"
import { useMemo } from "react"
import { transformCategoryToNestedFormOptions } from "../../../../domain/categories/utils/transform-response"
import { NestedMultiselectOption } from "../../../../domain/categories/components/multiselect"

const useOrganizeData = () => {
  const { product_types } = useAdminProductTypes(undefined, {
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const { collections } = useAdminCollections()
  const { product_categories: categories = [] } = useAdminProductCategories(
    {
      parent_category_id: "null",
    }
  )

  const productTypeOptions = useMemo(() => {
    return (
      product_types?.map(({ id, value }) => ({
        value: id,
        label: value,
      })) || []
    )
  }, [product_types])

  const collectionOptions = useMemo(() => {
    return (
      collections?.map(({ id, title }) => ({
        value: id,
        label: title,
      })) || []
    )
  }, [collections])
  const categoriesOptions: NestedMultiselectOption[] | undefined = useMemo(
    () => categories?.map(transformCategoryToNestedFormOptions),
    [categories]
  )

  // const categoriesOptions: NestedMultiselectOption[] | undefined = useMemo(
  //   () => categories?.map(transformCategoryToNestedFormOptions),
  //   [categories]
  // )

  return {
    productTypeOptions,
    collectionOptions,
    categoriesOptions
  }
}

export default useOrganizeData
