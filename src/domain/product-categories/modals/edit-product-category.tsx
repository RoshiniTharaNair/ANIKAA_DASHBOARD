import { useEffect, useState } from "react"
import { ProductCategory } from "@medusajs/medusa"
import { useAdminUpdateProductCategory } from "medusa-react"
import { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import Button from "../../../components/fundamentals/button"
import CrossIcon from "../../../components/fundamentals/icons/cross-icon"
import InputField from "../../../components/molecules/input"
import TextArea from "../../../components/molecules/textarea"
import SideModal from "../../../components/molecules/modal/side-modal"
import { NextSelect } from "../../../components/molecules/select/next-select"
import useNotification from "../../../hooks/use-notification"
import { Option } from "../../../types/shared"
import { getErrorMessage } from "../../../utils/error-messages"
import TreeCrumbs from "../components/tree-crumbs"
import MetadataForm, {
  getSubmittableMetadata,
} from "../../../components/forms/general/metadata-form"
import { Controller, useForm, useWatch } from "react-hook-form"
import { nestedForm } from "../../../utils/nested-form"
import { CategoryFormData, CategoryStatus, CategoryVisibility } from "./add-product-category"
import { getDefaultCategoryValues } from "../utils"

const visibilityOptions: (t: TFunction) => Option[] = (t) => [
  {
    label: "Public",
    value: CategoryVisibility.Public,
  },
  { label: "Private", value: CategoryVisibility.Private },
]

const statusOptions: (t: TFunction) => Option[] = (t) => [
  { label: "Active", value: CategoryStatus.Active },
  { label: "Inactive", value: CategoryStatus.Inactive },
]


type MeasurementAttribute = {
  attributeName: string
  imageFile: File | null
  imageUrl: string | null
}

type EditProductCategoriesSideModalProps = {
  activeCategory?: ProductCategory
  close: () => void
  isVisible: boolean
  categories: ProductCategory[]
}

function EditProductCategoriesSideModal(
  props: EditProductCategoriesSideModalProps
) {
  const { isVisible, close, activeCategory, categories } = props
  const { t } = useTranslation()
  const notification = useNotification()

  const { mutateAsync: updateCategory } = useAdminUpdateProductCategory(
    activeCategory?.id
  )

  const form = useForm<CategoryFormData>({
    defaultValues: getDefaultCategoryValues(t, activeCategory),
    mode: "onChange",
  })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isDirty, isValid, isSubmitting },
    trigger,
  } = form

  useEffect(() => {
    if (activeCategory) {
      reset(getDefaultCategoryValues(t, activeCategory))
    }
  }, [activeCategory, reset])

  useEffect(() => {
    if (activeCategory) {
      reset(getDefaultCategoryValues(t, activeCategory))

      // Fetch category images and measurements
      const fetchCategoryDetails = async () => {
        try {
          const [imageResponse, measurementResponse] = await Promise.all([
            fetch(`http://localhost:9000/store/categoryImage?category_id=${activeCategory.id}`),
            fetch(`http://localhost:9000/store/categoryMeasurement?category_id=${activeCategory.id}`)
          ])
          
          const imageResult = await imageResponse.json()
          const measurementResult = await measurementResponse.json()

          if (imageResult.data && imageResult.data.length > 0) {
            const { categorythumbnail, navimage } = imageResult.data[0]
            setExistingCategoryImage(categorythumbnail)
            setExistingNavImage(navimage)
          }

          if (measurementResult.data && measurementResult.data.length > 0) {
            setMeasurements(measurementResult.data[0].measurements)
          } else {
            setMeasurements([])
          }
        } catch (error) {
          console.error("Failed to fetch category details:", error)
        }
      }

      fetchCategoryDetails()
    }
  }, [activeCategory, reset])

  const categoryImageFile = watch("categoryimage")
  const navImageFile = watch("navimage")

  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)
  const [navImagePreview, setNavImagePreview] = useState<string | null>(null)
  const [existingCategoryImage, setExistingCategoryImage] = useState<string | null>(null)
  const [existingNavImage, setExistingNavImage] = useState<string | null>(null)
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
const [avgDeliveryTime, setAvgDeliveryTime] = useState<number | null>(null);
const [orderFrequency, setOrderFrequency] = useState<number | null>(null);
// const [measurements, setMeasurements] = useState<any[]>([]) // For storing measurement attributes
const [measurements, setMeasurements] = useState<MeasurementAttribute[]>([])
const [measurementsDirty, setMeasurementsDirty] = useState(false)


  useEffect(() => {
    const fetchCategoryImages = async () => {
      if (activeCategory) {
        const response = await fetch(`http://localhost:9000/store/categoryImage?category_id=${activeCategory.id}`)
        const result = await response.json()

        if (result.data && result.data.length > 0) {
          const { categorythumbnail, navimage, avg_price, avg_delivery_time, order_frequency } = result.data[0];
        
          // Set existing images
          setExistingCategoryImage(categorythumbnail);
          setExistingNavImage(navimage);
        
          // Set avg_price, avg_delivery_time, and order_frequency
          setAvgPrice(avg_price);
          setAvgDeliveryTime(avg_delivery_time);
          setOrderFrequency(order_frequency);
        
          // Reset the form fields
          reset(getDefaultCategoryValues(t, activeCategory));
        }
        else {
          setExistingCategoryImage(null)
          setExistingNavImage(null)
        }
      } else {
        setExistingCategoryImage(null)
        setExistingNavImage(null)
      }

      setCategoryImagePreview(null)
      setNavImagePreview(null)
    }

    fetchCategoryImages()
  }, [activeCategory])

  useEffect(() => {
    if (categoryImageFile && categoryImageFile.length > 0) {
      const file = categoryImageFile[0]
      const url = URL.createObjectURL(file)
      setCategoryImagePreview(url)
      trigger()
    } else {
      setCategoryImagePreview(null)
    }
  }, [categoryImageFile, trigger])

  useEffect(() => {
    if (navImageFile && navImageFile.length > 0) {
      const file = navImageFile[0]
      const url = URL.createObjectURL(file)
      setNavImagePreview(url)
      trigger()
    } else {
      setNavImagePreview(null)
    }
  }, [navImageFile, trigger])

   // Fetch measurements
   useEffect(() => {
    const fetchMeasurements = async () => {
      if (activeCategory) {
        const response = await fetch(`http://localhost:9000/store/categoryMeasurement?category_id=${activeCategory.id}`)
        const result = await response.json()

        console.log("result edit useEffect ", result)
        if (result.data && result.data.length > 0) {
          setMeasurements(result.data[0].measurements) // Store the measurements in state
          console.log("result.data[0].measurements ",result.data[0].measurements)

          console.log("measurements ",measurements)
        }
      }
    }

    fetchMeasurements()
  }, [activeCategory])

  const addAttribute = () => {
    setMeasurements([...measurements, { attributeName: "",  imageFile: null, imageUrl: null }])
    setMeasurementsDirty(true) // Mark measurements as modified

  }

  const removeAttribute = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index))
    setMeasurementsDirty(true) // Mark measurements as modified

  }

  const handleMeasurementChange = (index: number, field: keyof MeasurementAttribute, value: any) => {
    const updatedMeasurements = [...measurements]
    updatedMeasurements[index][field] = value

    // If an image file is selected, generate a preview URL
    if (field === 'imageFile' && value) {
      updatedMeasurements[index].imageUrl = URL.createObjectURL(value)
    }

    setMeasurements(updatedMeasurements)
    setMeasurementsDirty(true) // Mark measurements as modified

  }

  const uploadMeasurementImages = async () => {
    const formData = new FormData();
  
    measurements.forEach((attr, idx) => {
      if (attr.imageFile) {
        formData.append(`image-${idx}`, attr.imageFile);
      }
    });
  
    const response = await fetch("http://localhost:9000/store/categoryImageUpload", {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Failed to upload measurement images");
    }
  
    const result = await response.json();
  
    // console.log("result categoryImageUpload ", result);
    // console.log("measurements categoryImageUpload ", measurements);
  
    // Safely update attributes with uploaded image URLs
    const updatedAttributes = measurements.map((attr, idx) => {
      const fileKey = `image-${idx}`;
      const imageUrl = result.files && result.files[fileKey] ? result.files[fileKey][0]?.url : attr.imageUrl;

      // console.log("imageUrl ",imageUrl)
      return {
        ...attr,
        imageUrl,
      };
    });
  
    return updatedAttributes;
  };
  
  
  const onSave = async (data: CategoryFormData) => {
    try {
      // Step 1: Update the basic category information
      await updateCategory({
        name: data.name,
        handle: data.handle,
        description: data.description,
        is_active: data.is_active.value === CategoryStatus.Active,
        is_internal: data.is_public.value === CategoryVisibility.Private,
        metadata: getSubmittableMetadata(data.metadata),
      });
  
      // Step 2: Upload category and navigation images (if any)
      if (categoryImageFile || navImageFile) {
        const uploadResult = await uploadImages(data.categoryimage, data.navimage);
        const categoryImageUrl = uploadResult.files.categoryImage?.url;
        const navImageUrl = uploadResult.files.navImage?.url;
  
        await updateCategoryWithImages(activeCategory?.id ?? "", categoryImageUrl, navImageUrl);
      }
  
      const uploadedImages = await uploadMeasurementImages();
  
      console.log("uploadedImages: ", uploadedImages);

      measurements.forEach((attr, idx) => {
        console.log(`Attribute ${idx + 1}:`);
        console.log("Attribute Name:", attr.attributeName);
        console.log("Uploaded Image URL:", uploadedImages[idx]?.imageUrl || "");
      });
      // Step 3: Upload measurement images and update measurements
      const updatedMeasurements = await uploadMeasurementImages()
      await fetch(`http://localhost:9000/store/categoryMeasurement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: activeCategory?.id,
          measurements: updatedMeasurements.map(attr => ({
            attributeName: attr.attributeName,
            imageUrl: attr.imageUrl,
          })),
        }),
      })

      console.log("updatedMeasurements ",updatedMeasurements)
  
      // Step 5: Show success notification
      notification(
        t("modals-success", "Success"),
        t("modals-successfully-updated-the-category", "Successfully updated the category"),
        "success"
      );
      close();
    } catch (e) {
      const errorMessage = getErrorMessage(e) || t("modals-failed-to-update-the-category", "Failed to update the category");
      notification(t("modals-error", "Error"), errorMessage, "error");
    }
  };
  

  const onClose = () => {
    close()
  }

  const uploadImages = async (categoryimage: FileList | null, navimage: FileList | null) => {
    const formData = new FormData()

    if (categoryimage && categoryimage.length > 0) {
      formData.append("categoryimage", categoryimage[0])
    }
    if (navimage && navimage.length > 0) {
      formData.append("navimage", navimage[0])
    }

    const response = await fetch("http://localhost:9000/store/imageUpload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload images")
    }

    const result = await response.json()
    return result
  }

  const updateCategoryWithImages = async (categoryId: string, categoryImageUrl: string, navImageUrl: string) => {
    const body = {
      category_id: categoryId,
      navimage: navImageUrl,
      categorythumbnail: categoryImageUrl,
    }

    const response = await fetch("http://localhost:9000/store/categoryImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    console.log("body edit  ",body)
    if (!response.ok) {
      throw new Error("Failed to update category with image URLs")
    }

    const result = await response.json()

    console.log("result edit ",result)

    return result
  }

  return (
    <SideModal close={onClose} isVisible={!!isVisible}>
      <div className="flex h-full flex-col justify-between overflow-auto">
        <div className="flex items-center justify-between p-6">
          <Button size="small" variant="secondary" className="h-8 w-8 p-2" onClick={props.close}>
            <CrossIcon size={20} className="text-grey-50" />
          </Button>
          <div className="gap-x-small flex">
            <Button size="small" variant="primary" disabled={(!isDirty && !measurementsDirty) || !isValid || isSubmitting} onClick={handleSubmit(onSave)} className="rounded-rounded">
              {t("modals-save-category", "Save category")}
            </Button>
          </div>
        </div>

        <h3 className="inter-large-semibold flex items-center gap-2 text-xl text-gray-900 px-6">
          {t("modals-edit-product-category", "Edit product category")}
        </h3>

        <div className="block h-[1px] bg-gray-200" />

        {activeCategory && (
          <div className="mt-[25px] px-6">
            <TreeCrumbs nodes={categories} currentNode={activeCategory} />
          </div>
        )}

        <div className="flex-grow px-6">
          <InputField required label={t("modals-name", "Name") as string} type="string" className="my-6" placeholder={t("modals-give-this-category-a-name", "Give this category a name") as string} {...register("name", { required: true })} />

          <InputField label={t("modals-handle", "Handle") as string} className="my-6" type="string" disabled placeholder={t("modals-custom-handle", "Custom handle") as string} {...register("handle")} />

          <TextArea label={t("modals-description", "Description")} className="my-6" placeholder={t("modals-give-this-category-a-description", "Give this category a description") as string} {...register("description")} />

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700">{t("modals-category-image", "Category Image")}</label>
            <input type="file" accept="image/*" {...register("categoryimage")} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            {existingCategoryImage && !categoryImagePreview && (
              <div className="mt-4">
                <img src={existingCategoryImage} alt="Existing Category" className="h-40 w-full object-cover rounded-lg shadow-lg" />
              </div>
            )}
            {categoryImagePreview && (
              <div className="mt-4">
                <img src={categoryImagePreview} alt="Category Preview" className="h-40 w-full object-cover rounded-lg shadow-lg" />
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700">{t("modals-navigation-image", "Navigation Image")}</label>
            <input type="file" accept="image/*" {...register("navimage")} className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            {existingNavImage && !navImagePreview && (
              <div className="mt-4">
                <img src={existingNavImage} alt="Existing Navigation" className="h-40 w-full object-cover rounded-lg shadow-lg" />
              </div>
            )}
            {navImagePreview && (
              <div className="mt-4">
                <img src={navImagePreview} alt="Navigation Preview" className="h-40 w-full object-cover rounded-lg shadow-lg" />
              </div>
            )}
          </div>

          {avgPrice != null && (
  <div className="mb-8">
    <h4 className="text-sm font-medium text-gray-700">Average Price:</h4>
    <p className="mt-1 text-gray-900">${avgPrice.toFixed(2)}</p>
  </div>
)}

{avgDeliveryTime != null && (
  <div className="mb-8">
    <h4 className="text-sm font-medium text-gray-700">Average Delivery Days Taken:</h4>
    <p className="mt-1 text-gray-900">{avgDeliveryTime} days</p>
  </div>
)}

{orderFrequency != null && (
  <div className="mb-8">
    <h4 className="text-sm font-medium text-gray-700">Number of Times Purchased:</h4>
    <p className="mt-1 text-gray-900">{orderFrequency} times</p>
  </div>
)}

  {/* Measurements Section */}
  <div className="mb-8">
            <h4 className="inter-large-semibold text-grey-90 pb-4">{t("modals-measurements", "Measurements")}</h4>
            <table className="min-w-full table-auto bg-white border border-gray-200 shadow-md rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">{t("modals-attribute-name", "Attribute Name")}</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">{t("modals-attribute-image", "Attribute Image")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((attribute, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="e.g., Front Neck"
                        className="form-input w-full border rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={attribute.attributeName}
                        onChange={(e) => handleMeasurementChange(index, "attributeName", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input w-full px-3 py-2 text-sm text-gray-500 bg-white border rounded-md shadow-sm"
                        onChange={(e) => handleMeasurementChange(index, "imageFile", e.target.files?.[0] || null)}
                      />
                      {attribute.imageUrl && (
                        <img
                          src={attribute.imageUrl}
                          alt={`${attribute.attributeName} preview`}
                          className="mt-2 h-16 w-16 object-cover rounded-md shadow-sm"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => removeAttribute(index)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="ghost" onClick={addAttribute} className="mt-4 text-indigo-600 hover:text-indigo-800">
              {t("modals-add-attribute", "Add Attribute")}
            </Button>
          </div>

          <Controller
            name="is_active"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              return (
                <NextSelect
                  {...field}
                  label={t("modals-status", "Status") as string}
                  placeholder="Choose status"
                  options={statusOptions(t)}
                  value={statusOptions(t)[field.value?.value === CategoryStatus.Active ? 0 : 1]}
                />
              )
            }}
          />

          <div className="py-6">
            <Controller
              name="is_public"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <NextSelect
                    {...field}
                    label={t("modals-visibility", "Visibility") as string}
                    placeholder="Choose visibility"
                    options={visibilityOptions(t)}
                    value={visibilityOptions(t)[field.value.value === CategoryVisibility.Public ? 0 : 1]}
                  />
                )
              }}
            />
          </div>
        </div>
      </div>
    </SideModal>
  )
}

export default EditProductCategoriesSideModal
