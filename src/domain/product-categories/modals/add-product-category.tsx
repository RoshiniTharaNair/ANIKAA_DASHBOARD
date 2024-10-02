import { ProductCategory } from "@medusajs/medusa";
import {
  adminProductCategoryKeys,
  useAdminCreateProductCategory,
} from "medusa-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import Button from "../../../components/fundamentals/button";
import CrossIcon from "../../../components/fundamentals/icons/cross-icon";
import InputField from "../../../components/molecules/input";
import TextArea from "../../../components/molecules/textarea";
import FocusModal from "../../../components/molecules/modal/focus-modal";
import { NextSelect } from "../../../components/molecules/select/next-select";
import useNotification from "../../../hooks/use-notification";
import { getErrorMessage } from "../../../utils/error-messages";
import TreeCrumbs from "../components/tree-crumbs";
import MetadataForm, {
  getSubmittableMetadata,
  MetadataFormType,
} from "../../../components/forms/general/metadata-form";
import { Controller, useForm } from "react-hook-form";
import { TFunction } from "i18next";
import { getDefaultCategoryValues } from "../utils";
import { useState } from "react";

export enum CategoryStatus {
  Active = "active",
  Inactive = "inactive",
}

export enum CategoryVisibility {
  Public = "public",
  Private = "private",
}

const visibilityOptions = (
  t: TFunction<"translation", undefined, "translation">
) => [
  {
    label: t("modals-public", "Public"),
    value: CategoryVisibility.Public,
  },
  { label: t("modals-private", "Private"), value: CategoryVisibility.Private },
];

const statusOptions = (
  t: TFunction<"translation", undefined, "translation">
) => [
  { label: t("modals-active", "Active"), value: CategoryStatus.Active },
  { label: t("modals-inactive", "Inactive"), value: CategoryStatus.Inactive },
];

type CreateProductCategoryProps = {
  closeModal: () => void;
  parentCategory?: ProductCategory;
  categories: ProductCategory[];
};

export type CategoryFormData = {
  name: string;
  handle: string | undefined;
  description: string | undefined;
  metadata: MetadataFormType;
  categoryimage: FileList | null;
  navimage: FileList | null;
  avg_price?: number; // Add this
  avg_delivery_time?: number; // Add this
  order_frequency?: number; // Add this
  is_active: {
    value: CategoryStatus;
    label: string;
  };
  is_public: {
    value: CategoryVisibility;
    label: string;
  };
};

type MeasurementAttribute = {
  attributeName: string;
  imageFile: File | null;
  imageUrl: string | null;
};

function CreateProductCategory(props: CreateProductCategoryProps) {
  const { t } = useTranslation();
  const { closeModal, parentCategory, categories } = props;
  const notification = useNotification();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    defaultValues: getDefaultCategoryValues(t),
    mode: "onChange",
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = form;
  const name = watch("name", "");

  const [measurementAttributes, setMeasurementAttributes] = useState<
  MeasurementAttribute[]
>([]);

const addAttribute = () => {
  setMeasurementAttributes([
    ...measurementAttributes,
    { attributeName: "", imageFile: null, imageUrl: null },
  ]);
};

const removeAttribute = (index: number) => {
  setMeasurementAttributes(
    measurementAttributes.filter((_, i) => i !== index)
  );
};

const handleAttributeChange = (
  index: number,
  field: keyof MeasurementAttribute,
  value: any
) => {
  const updatedAttributes = [...measurementAttributes];
  updatedAttributes[index][field] = value;
  setMeasurementAttributes(updatedAttributes);
};

const uploadMeasurementImages = async () => {
  const formData = new FormData();

  // Loop through each measurement attribute and append the image file if it exists
  measurementAttributes.forEach((attr, idx) => {
    if (attr.imageFile) {
      formData.append(`image-${idx}`, attr.imageFile); // Append image files with corresponding index
    }
  });

  // Make a request to upload all the images to the /categoryImageUpload API
  const response = await fetch("http://localhost:9000/store/categoryImageUpload", {
    method: "POST",
    body: formData,
  });

  // If the upload fails, throw an error
  if (!response.ok) {
    throw new Error("Failed to upload measurement images");
  }

  // Get the uploaded image URLs from the response
  const result = await response.json();

  console.log("result category ", result);
  
  // Loop through the uploaded images and match them with the measurement attributes
  const updatedAttributes = measurementAttributes.map((attr, idx) => {
    // Get the image URL from the response by the image index
    // console.log("idx ",idx)
    // console.log("result.files[`image-${idx}`] ",result.files[`image-${idx}`][0].url)
    const imageUrl = result.files[`image-${idx}`][0]?.url || null;

    // Return the updated attribute with the assigned image URL
    return {
      ...attr,
      imageUrl: imageUrl,  // Assign the uploaded image URL to the corresponding attribute
    };
  });

  console.log("updatedAttributes category ", updatedAttributes);

  // Return the updated measurement attributes with their corresponding image URLs
  return updatedAttributes;
};


  const { mutateAsync: createProductCategory } =
    useAdminCreateProductCategory();

  const uploadImages = async (
    categoryimage: FileList | null,
    navimage: FileList | null
  ) => {
    const formData = new FormData();

    if (categoryimage && categoryimage.length > 0) {
      formData.append("categoryimage", categoryimage[0]);
    }
    if (navimage && navimage.length > 0) {
      formData.append("navimage", navimage[0]);
    }

    const response = await fetch("http://localhost:9000/store/imageUpload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload images");
    }

    const result = await response.json();

    // console.log("result ",result)

    return result;
  };

  const updateCategoryWithImages = async (
    categoryId: string,
    categoryImageUrl: string,
    navImageUrl: string
  ) => {
    const body = {
      category_id: categoryId,
      navimage: navImageUrl,
      categorythumbnail: categoryImageUrl,
    };

    const response = await fetch("http://localhost:9000/store/categoryImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to update category with image URLs");
    }

    const result = await response.json();
    return result;
  };

  const submit = handleSubmit(async (data) => {
    try {
      console.log("data ", data);
  
      // Step 1: Create the product category and get the category ID
      const createCategoryResponse = await createProductCategory({
        name: data.name,
        handle: data.handle,
        description: data.description,
        is_active: data.is_active.value === CategoryStatus.Active,
        is_internal: data.is_public.value === CategoryVisibility.Private,
        parent_category_id: parentCategory?.id ?? null,
        metadata: getSubmittableMetadata(data.metadata),
      });
  
      // Get the newly created category ID
      const categoryId = createCategoryResponse.product_category.id;
  
      // Step 2: Upload category and navigation images
      const uploadResult = await uploadImages(data.categoryimage, data.navimage);
  
      const categoryImageUrl = uploadResult.files.categoryImage?.url;
      const navImageUrl = uploadResult.files.navImage?.url;
  
      // Step 3: Update the category with the uploaded category and navigation images
      await updateCategoryWithImages(categoryId, categoryImageUrl, navImageUrl);
  
      // Step 4: Upload measurement attribute images
      const uploadedImages = await uploadMeasurementImages();
  
      console.log("uploadedImages: ", uploadedImages);
  
      // Loop to display each attribute and its corresponding uploaded image URL
      measurementAttributes.forEach((attr, idx) => {
        console.log(`Attribute ${idx + 1}:`);
        console.log("Attribute Name:", attr.attributeName);
        console.log("Uploaded Image URL:", uploadedImages[idx]?.imageUrl || "");
      });
  
      // Step 5: Update image URLs for each attribute in the measurement attributes
      const updatedAttributes = measurementAttributes.map((attr, idx) => {
        const imageUrl = uploadedImages[idx]?.imageUrl || "";
        console.log(`Assigning URL for attribute ${attr.attributeName}:`, imageUrl);
        
        return {
          attributeName: attr.attributeName,
          imageUrl, // Assign the uploaded image URL to each attribute
        };
      });
  
      console.log("updatedAttributes: ", updatedAttributes);
  
      // Step 6: Submit measurement attributes to the categoryMeasurement API with the correct categoryId
      await fetch("http://localhost:9000/store/categoryMeasurement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: categoryId,
          measurements: updatedAttributes,
        }),
      });
  
      // Step 7: Invalidate cache and show success notification
      await queryClient.invalidateQueries(adminProductCategoryKeys.lists());
      closeModal();
      notification(
        t("modals-success", "Success"),
        t(
          "modals-successfully-created-a-category",
          "Successfully created a category"
        ),
        "success"
      );
    } catch (e) {
      const errorMessage =
        getErrorMessage(e) ||
        t(
          "modals-failed-to-create-a-new-category",
          "Failed to create a new category"
        );
      notification(t("modals-error", "Error"), errorMessage, "error");
    }
  });
  
  
  return (
    <FocusModal>
      <FocusModal.Header>
        <div className="medium:w-8/12 flex w-full justify-between px-8">
          <Button size="small" variant="ghost" onClick={closeModal}>
            <CrossIcon size={20} />
          </Button>
          <div className="gap-x-small flex">
            <Button
              size="small"
              variant="primary"
              disabled={!isDirty || !isValid || isSubmitting}
              onClick={submit}
              className="rounded-rounded"
            >
              {t("modals-save-category", "Save category")}
            </Button>
          </div>
        </div>
      </FocusModal.Header>
      <FocusModal.Main className="no-scrollbar flex w-full justify-center">
        <div className="small:w-4/5 medium:w-7/12 large:w-6/12 my-16 max-w-[700px]">
          <h1 className="inter-xlarge-semibold text-grey-90 pb-6">
            {parentCategory
              ? t("modals-add-category-to", {
                  name: parentCategory.name,
                  defaultValue: `Add category to ${parentCategory.name}`,
                })
              : t("modals-add-category", "Add category")}
          </h1>

          {parentCategory && (
            <div className="mb-6">
              <TreeCrumbs
                nodes={categories}
                currentNode={parentCategory}
                showPlaceholder={true}
                placeholderText={name || "New"}
              />
            </div>
          )}

          <h4 className="inter-large-semibold text-grey-90 pb-1">
            {t("modals-details", "Details")}
          </h4>

          <div className="mb-8 flex justify-between gap-6">
            <InputField
              required
              label={t("modals-name", "Name") as string}
              type="string"
              className="w-[338px]"
              placeholder={
                t(
                  "modals-give-this-category-a-name",
                  "Give this category a name"
                ) as string
              }
              {...register("name", { required: true })}
            />
          </div>

          <div className="mb-8">
            <TextArea
              label={t("modals-description", "Description")}
              placeholder={
                t(
                  "modals-give-this-category-a-description",
                  "Give this category a description"
                ) as string
              }
              {...register("description")}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700">
              {t("modals-category-image", "Category Image")}
            </label>
            <input
              type="file"
              accept="image/*"
              {...register("categoryimage")}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setValue("categoryImagePreview", url);
                }
              }}
            />
            {watch("categoryImagePreview") && (
              <div className="mt-4">
                <img
                  src={watch("categoryImagePreview")}
                  alt="Category Preview"
                  className="h-40 w-full object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700">
              {t("modals-navigation-image", "Navigation Image")}
            </label>
            <input
              type="file"
              accept="image/*"
              {...register("navimage")}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setValue("navImagePreview", url);
                }
              }}
            />
            {watch("navImagePreview") && (
              <div className="mt-4">
                <img
                  src={watch("navImagePreview")}
                  alt="Navigation Image Preview"
                  className="h-40 w-full object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>

          <div className="mb-8 flex justify-between gap-6">
            <div className="flex-1">
              <Controller
                name={"is_active"}
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  return (
                    <NextSelect
                      {...field}
                      label={t("modals-status", "Status") as string}
                      placeholder="Choose status"
                      options={statusOptions(t)}
                      value={
                        statusOptions(t)[
                          field.value?.value === CategoryStatus.Active ? 0 : 1
                        ]
                      }
                    />
                  );
                }}
              />
            </div>

            <div className="flex-1">
              <Controller
                name={"is_public"}
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  return (
                    <NextSelect
                      {...field}
                      label={
                        t("modals-visibility", "Visibility") as string
                      }
                      placeholder="Choose visibility"
                      options={visibilityOptions(t)}
                      value={
                        visibilityOptions(t)[
                          field.value.value === CategoryVisibility.Public ? 0 : 1
                        ]
                      }
                    />
                  );
                }}
              />
            </div>

            
          </div>
            {/* Measurements Table */}
            <div className="mb-8">
  <h4 className="inter-large-semibold text-grey-90 pb-4">
    {t("modals-measurements", "Measurements")}
  </h4>
  <table className="min-w-full table-auto bg-white border border-gray-200 shadow-md rounded-lg">
    <thead className="bg-gray-100">
      <tr>
        <th className="text-left px-4 py-2 text-gray-600 font-medium">
          {t("modals-attribute-name", "Attribute Name")}
        </th>
        <th className="text-left px-4 py-2 text-gray-600 font-medium">
          {t("modals-attribute-image", "Attribute Image")}
        </th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {measurementAttributes.map((attribute, index) => (
        <tr key={index} className="border-b border-gray-200">
          <td className="px-4 py-3">
            <input
              type="text"
              placeholder="e.g., Front Neck"
              className="form-input w-full border rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={attribute.attributeName}
              onChange={(e) =>
                handleAttributeChange(index, "attributeName", e.target.value)
              }
            />
          </td>
          <td className="px-4 py-3">
            <input
              type="file"
              accept="image/*"
              className="file-input w-full px-3 py-2 text-sm text-gray-500 bg-white border rounded-md shadow-sm"
              onChange={(e) =>
                handleAttributeChange(index, "imageFile", e.target.files?.[0] || null)
              }
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

        </div>
      </FocusModal.Main>
    </FocusModal>
  );
}

export default CreateProductCategory;
