import React, { useMemo, useEffect, useCallback } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { ContinetViewModel } from "../../../../../src/types/continent.types";
import { Product } from "../../../../../src/types/product.types";
import { MdOutlineDeleteForever } from "react-icons/md";
import axiosInstance from "@/api/axiosInstance";

interface Props {
    continent: ContinetViewModel;
    setContinent: React.Dispatch<React.SetStateAction<ContinetViewModel>>;
}

const importanceOptions = ["A", "B", "C", "D"] as const;

const CountriesSelector: React.FC<Props> = ({ continent, setContinent }) => {
    const editMode = continent._id !== null && continent._id !== undefined;
    const options = useMemo(() => countryList().getData(), []);

    const fetchProductsByParent = useCallback(async (parentId: string) => {
        try {
            const { data } = await axiosInstance.get(`/products/by-parent/${parentId}`);
            return data;
        } catch (err) {
            console.error("Failed to fetch products", err);
            return [];
        }
    }, []);

    useEffect(() => {
        if (!continent._id) return;

        const loadProducts = async () => {
            const result = await fetchProductsByParent(continent._id);
            setContinent((prev) => ({
                ...prev,
                productObjects: result.products ?? [],
            }));
        };

        loadProducts();
    }, [continent._id, fetchProductsByParent, setContinent]);

    useEffect(() => {
        if (!continent.productObjects) {
            setContinent((prev) => ({
                ...prev,
                productObjects: [],
            }));
        }
    }, [continent.productObjects, setContinent]);

    const handleSelect = (selectedOption: { label: string; value: string } | null) => {
        if (!selectedOption) return;

        const countryProduct: Product = {
            fileId: "",
            name: selectedOption.label,
            code: selectedOption.value,
            content: null,
            variant: null,
            media: null,
            tags: null,
            downloadCount: 0,
            importance: "A",
            parent: continent._id ?? null,
            children: [],
            recommended: [],
        };

        setContinent((prev) => ({
            ...prev,
            productObjects: [...(prev.productObjects ?? []), countryProduct],
        }));
    };

    const handleDelete = async (index: number) => {
        if (editMode) {
            const productId = continent.productObjects?.[index]?._id;
            if (!productId) return;

            try {
                const { data } = await axiosInstance.delete(`/products/${productId}`);

                setContinent((prev) => {
                    const updatedProducts = [...(prev.productObjects ?? [])];
                    updatedProducts.splice(index, 1);
                    return { ...prev, productObjects: updatedProducts };
                });

                return data;
            } catch (err) {
                console.error("Failed to delete product", err);
                return null;
            }
        }

        setContinent((prev) => {
            const updatedProducts = [...(prev.productObjects ?? [])];
            updatedProducts.splice(index, 1);
            return { ...prev, productObjects: updatedProducts };
        });
    };

    const handleProductChange = (
        index: number,
        key: keyof Product,
        value: any
    ) => {
        setContinent((prev) => {
            const updatedProducts = [...(prev.productObjects ?? [])];

            updatedProducts[index] = {
                ...updatedProducts[index],
                [key]: value,
            };

            return {
                ...prev,
                productObjects: updatedProducts,
            };
        });
    };

    const themedInputStyle: React.CSSProperties = {
        background: "var(--bg2)",
        color: "var(--txt)",
        border: "1px solid var(--bdr)",
        boxShadow: "none",
    };

    const themedDisabledInputStyle: React.CSSProperties = {
        ...themedInputStyle,
        background: "var(--bgp2)",
        color: "var(--mu)",
        opacity: 1,
        cursor: "not-allowed",
    };

    const headerTextStyle: React.CSSProperties = {
        color: "var(--txt)",
        fontWeight: 700,
    };

    const reactSelectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: "var(--bg2)",
            borderColor: state.isFocused ? "var(--ora)" : "var(--bdr)",
            boxShadow: state.isFocused ? "0 0 0 1px var(--ora)" : "none",
            "&:hover": {
                borderColor: "var(--ora)",
            },
            minHeight: 38,
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: "var(--bg2)",
            color: "var(--txt)",
            border: "1px solid var(--bdr)",
            zIndex: 20,
        }),
        menuList: (base: any) => ({
            ...base,
            backgroundColor: "var(--bg2)",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused
                ? "var(--bgp)"
                : state.isSelected
                ? "var(--ora)"
                : "var(--bg2)",
            color: state.isSelected ? "#fff" : "var(--txt)",
            cursor: "pointer",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: "var(--txt)",
        }),
        input: (base: any) => ({
            ...base,
            color: "var(--txt)",
        }),
        placeholder: (base: any) => ({
            ...base,
            color: "var(--mu)",
        }),
        dropdownIndicator: (base: any) => ({
            ...base,
            color: "var(--mu)",
            "&:hover": {
                color: "var(--txt)",
            },
        }),
        indicatorSeparator: (base: any) => ({
            ...base,
            backgroundColor: "var(--bdr)",
        }),
        clearIndicator: (base: any) => ({
            ...base,
            color: "var(--mu)",
            "&:hover": {
                color: "var(--txt)",
            },
        }),
    };

    return (
        <div style={{ color: "var(--txt)" }}>
            <div className="col-lg-3 col-12">
                <label className="form-label" style={headerTextStyle}>
                    Countries
                </label>

                <Select
                    options={options}
                    onChange={handleSelect}
                    placeholder="Select country"
                    isSearchable
                    styles={reactSelectStyles}
                    theme={(theme) => ({
                        ...theme,
                        borderRadius: 6,
                        colors: {
                            ...theme.colors,
                            primary: "var(--ora)",
                            primary25: "var(--bgp)",
                            primary50: "var(--bgp2)",
                            neutral0: "var(--bg2)",
                            neutral5: "var(--bg2)",
                            neutral10: "var(--bdr)",
                            neutral20: "var(--bdr)",
                            neutral30: "var(--ora)",
                            neutral40: "var(--mu)",
                            neutral50: "var(--mu)",
                            neutral60: "var(--txt)",
                            neutral70: "var(--txt)",
                            neutral80: "var(--txt)",
                            neutral90: "var(--txt)",
                        },
                    })}
                    filterOption={(option, inputValue) =>
                        option.label.toLowerCase().includes(inputValue.toLowerCase())
                    }
                />
            </div>

            <div>
                {(continent.productObjects ?? []).length > 0 && (
                    <div
                        className="d-flex mt-3 mb-1 fw-bold align-items-center"
                        style={{ color: "var(--txt)" }}
                    >
                        <div style={{ width: "25%" }}>Name</div>
                        <div style={{ width: "15%" }}>Code</div>
                        <div style={{ width: "30%" }}>File ID</div>
                        <div style={{ width: "15%" }}>Importance</div>
                        <div style={{ width: "15%" }}>Actions</div>
                    </div>
                )}

                {(continent.productObjects ?? []).map((product, index) => (
                    <div
                        key={index}
                        className="d-flex gap-2 mt-2 align-items-center mb-1"
                    >
                        <input
                            type="hidden"
                            value={product._id}
                            name={`products[${index}]._id`}
                        />

                        <input
                            type="text"
                            className="form-control"
                            value={product.name}
                            readOnly
                            disabled
                            style={{ ...themedDisabledInputStyle, width: "25%" }}
                        />

                        <input
                            type="text"
                            className="form-control"
                            value={product.code}
                            readOnly
                            disabled
                            style={{ ...themedDisabledInputStyle, width: "15%" }}
                        />

                        <input
                            type="text"
                            className="form-control"
                            placeholder="File ID"
                            value={product.fileId}
                            onChange={(e) =>
                                handleProductChange(index, "fileId", e.target.value)
                            }
                            style={{ ...themedInputStyle, width: "30%" }}
                        />

                        <select
                            className="form-control"
                            value={product.importance}
                            onChange={(e) =>
                                handleProductChange(index, "importance", e.target.value)
                            }
                            style={{ ...themedInputStyle, width: "15%" }}
                        >
                            {importanceOptions.map((opt) => (
                                <option
                                    key={opt}
                                    value={opt}
                                    style={{
                                        background: "var(--bg2)",
                                        color: "var(--txt)",
                                    }}
                                >
                                    {opt}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            title="Delete the product"
                            onClick={() => handleDelete(index)}
                            className="btn d-flex justify-content-center align-items-center"
                            style={{
                                width: "15%",
                                fontSize: 24,
                                color: "var(--or3)",
                                border: "1px solid var(--bdr)",
                                background: "var(--bg2)",
                            }}
                        >
                            <MdOutlineDeleteForever />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CountriesSelector;