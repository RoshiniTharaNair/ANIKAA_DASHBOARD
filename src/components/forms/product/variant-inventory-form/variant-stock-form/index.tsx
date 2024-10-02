import React, { useState, useEffect } from "react"
import { Controller } from "react-hook-form"
import Switch from "../../../../../components/atoms/switch"
import InputField from "../../../../../components/molecules/input"
import { NestedForm } from "../../../../../utils/nested-form"
import { useAdminStockLocations } from "medusa-react"

export type VariantStockFormType = {
  manage_inventory: boolean
  allow_backorder: boolean
  inventory_quantity: number | null
  sku: string | null
  ean: string | null
  upc: string | null
  barcode: string | null
}

type Props = {
  form: NestedForm<VariantStockFormType>
  onInventoryChange: (updatedQuantities: Record<string, number | null>) => void
}

const VariantStockForm = ({ form, onInventoryChange }: Props) => {
  const {
    path,
    control,
    register,
    setValue,
    formState: { errors },
    watch, // Add watch to get the value of sku
  } = form

  const { stock_locations, isLoading } = useAdminStockLocations({
    expand: "address,sales_channels",
  })

  console.log('stock_locations', stock_locations)
  // Filter out the stock location with name "Online"
  const filteredStockLocations = stock_locations?.filter(
    (location) => location.name !== "Online"
  )

  // Variable to hold the ID of the "Online" stock location
  const [onlineLocationId, setOnlineLocationId] = useState<string | null>(null)

  // State to keep track of switch values
  const [switchStates, setSwitchStates] = useState(
    filteredStockLocations?.reduce((acc, location) => {
      acc[location.id] = false
      return acc
    }, {}) || {}
  )

  // State to keep track of inventory quantities
  const [inventoryQuantities, setInventoryQuantities] = useState(
    filteredStockLocations?.reduce((acc, location) => {
      acc[location.id] = 0 // Initialize with 0 instead of null
      return acc
    }, {}) || {}
  )

  const handleSwitchChange = (id, value) => {
    setSwitchStates((prev) => ({ ...prev, [id]: value }))
    if (!value) {
      handleQuantityChange(id, 0)
    }
  }

  const handleQuantityChange = (id, value) => {
    const numericValue = value === "" ? 0 : parseInt(value, 10)
    setInventoryQuantities((prev) => {
      const updatedQuantities = { ...prev, [id]: numericValue }
      onInventoryChange(updatedQuantities)
      return updatedQuantities
    })

    if (id === null && onlineLocationId) {
      setInventoryQuantities((prev) => {
        const updatedQuantities = { ...prev, [onlineLocationId]: numericValue }
        console.log(`Setting Online stock location quantity to: ${numericValue}`)
        onInventoryChange(updatedQuantities)
        return updatedQuantities
      })
      setValue(path(`inventory_quantity_${onlineLocationId}`), numericValue)
    }
  }

  // Get the SKU value using watch
  const sku = watch(path("sku"))

  // Watch for changes in the main inventory quantity input
  const mainInventoryQuantity = watch(path("inventory_quantity"))

  useEffect(() => {
    // Log the SKU value to the console whenever it changes
    console.log('SKU:', sku)

    // Get the "Online" stock location ID and set it to state
    const onlineLocation = stock_locations?.find(location => location.name === "Online")
    if (onlineLocation) {
      setOnlineLocationId(onlineLocation.id)
      console.log('Online Stock Location ID:', onlineLocation.id)

      // Update the "Online" stock location quantity to match the main inventory quantity
      handleQuantityChange(onlineLocation.id, mainInventoryQuantity || 0)
    }
  }, [sku, mainInventoryQuantity, stock_locations])

  return (
    <div>
      <p className="inter-base-regular text-grey-50">
        Configure the inventory and stock for this variant.
      </p>
      <div className="pt-large flex flex-col gap-y-xlarge">
        <div className="flex flex-col gap-y-2xsmall">
          <div className="flex items-center justify-between">
            <h3 className="inter-base-semibold mb-2xsmall">Allow backorders</h3>
            <Controller
              control={control}
              name={path("allow_backorder")}
              render={({ field: { value, onChange } }) => {
                return <Switch checked={value} onCheckedChange={onChange} />
              }}
            />
          </div>
          <p className="inter-base-regular text-grey-50">
            When checked the product will be available for purchase despite the
            product being sold out
          </p>
        </div>
        <div className="grid grid-cols-2 gap-large">
          <InputField
            label="Stock keeping unit (SKU)"
            placeholder="SUN-G, JK1234..."
            readOnly
            className="bg-gray-100 text-gray-500 cursor-not-allowed" // Add this line to style the input field
            {...register(path("sku"))}
          />
          <InputField
            label="Quantity in stock"
            type="number"
            required
            placeholder="100..."
            errors={errors}
            {...register(path("inventory_quantity"), {
              valueAsNumber: true,
              onChange: (e) => {
                handleQuantityChange(null, e.target.value)
                if (onlineLocationId) {
                  setValue(path(`inventory_quantity_${onlineLocationId}`), e.target.value)
                }
              }
            })}
          />
          <InputField
            label="EAN (Barcode)"
            placeholder="123456789102..."
            {...register(path("ean"))}
          />
          <InputField
            label="UPC (Barcode)"
            placeholder="023456789104..."
            {...register(path("upc"))}
          />
          <InputField
            label="Barcode"
            placeholder="123456789104..."
            {...register(path("barcode"))}
          />
        </div>

        {filteredStockLocations?.map((location) => (
          <div key={location.id} className="flex flex-col gap-y-2xsmall">
            <div className="flex items-center justify-between">
              <h3 className="inter-base-semibold mb-2xsmall">
                Manage inventory for {location.name}
              </h3>
              <Controller
                control={control}
                name={path(`manage_inventory_${location.id}`)}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => {
                        onChange(checked)
                        handleSwitchChange(location.id, checked)
                      }}
                    />
                  )
                }}
              />
            </div>
            {switchStates[location.id] && (
              <InputField
                label={`Quantity in stock for ${location.name}`}
                type="number"
                placeholder="100..."
                errors={errors}
                {...register(path(`inventory_quantity_${location.id}`), {
                  valueAsNumber: true,
                  onChange: (e) => handleQuantityChange(location.id, e.target.value)
                })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default VariantStockForm
