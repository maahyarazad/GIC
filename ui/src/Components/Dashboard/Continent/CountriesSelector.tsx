import React, { memo, useCallback, useEffect, useState } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { ContinetViewModel } from "../../../../../src/types/continent.types";
import { Product } from "../../../../../src/types/product.types";
import { MdOutlineDeleteForever, MdOutlineUploadFile } from "react-icons/md";
import axiosInstance from "@/api/axiosInstance";

type Notify = (toast: { type: "success" | "error"; message: string }) => void;

interface Props {
    continent: ContinetViewModel;
    setContinent: React.Dispatch<React.SetStateAction<ContinetViewModel>>;
    // Passed in from a parent that lives inside ToastProvider — the slide-menu
    // content is rendered outside that provider, so useToast is unavailable here.
    notify?: Notify;
}

type ProductChangeHandler = (index: number, key: keyof Product, value: any) => void;

const importanceOptions = ["A", "B", "C", "D"] as const;

// Static data and styles live at module scope: one identity for the app's lifetime,
// so react-select and the memoized rows never see a "new" prop from them.
const countryOptions = countryList().getData();
const EMPTY_PRODUCTS: Product[] = [];

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

// Per-column input styles, precomputed instead of spread on every row render.
const nameInputStyle: React.CSSProperties = { ...themedDisabledInputStyle, width: "20%" };
const codeInputStyle: React.CSSProperties = { ...themedDisabledInputStyle, width: "10%" };
const fileIdInputStyle: React.CSSProperties = { ...themedInputStyle, width: "23%" };
const versionInputStyle: React.CSSProperties = { ...themedInputStyle, width: "12%" };
const importanceSelectStyle: React.CSSProperties = { ...themedInputStyle, width: "12%" };
const importanceOptionStyle: React.CSSProperties = { background: "var(--bg2)", color: "var(--txt)" };
const actionsStyle: React.CSSProperties = { width: "23%" };

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

const selectTheme = (theme: any) => ({
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
});

const filterOption = (option: { label: string }, inputValue: string) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase());

interface ProductRowProps {
    product: Product;
    index: number;
    isUploading: boolean;
    onProductChange: ProductChangeHandler;
    onUploadPdf: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: (index: number, productId?: string) => void;
}

// Memoized: editing one product (or any other form field in the parent) only
// re-renders the row whose product object actually changed.
const ProductRow = memo(({
    product,
    index,
    isUploading,
    onProductChange,
    onUploadPdf,
    onDelete,
}: ProductRowProps) => {
    const handleFileIdChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onProductChange(index, "fileId", e.target.value),
        [index, onProductChange]
    );

    const handleVersionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) =>
            onProductChange(index, "productVersion", e.target.value || null),
        [index, onProductChange]
    );

    const handleImportanceChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => onProductChange(index, "importance", e.target.value),
        [index, onProductChange]
    );

    const handleUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => onUploadPdf(index, e),
        [index, onUploadPdf]
    );

    const handleDelete = useCallback(
        () => onDelete(index, product._id),
        [index, product._id, onDelete]
    );

    return (
        <div className="d-flex gap-2 mt-2 align-items-center mb-1">
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
                style={nameInputStyle}
            />

            <input
                type="text"
                className="form-control"
                value={product.code}
                readOnly
                disabled
                style={codeInputStyle}
            />

            <input
                type="text"
                className="form-control"
                placeholder="File ID"
                value={product.fileId}
                onChange={handleFileIdChange}
                style={fileIdInputStyle}
            />

            <input
                type="text"
                className="form-control"
                placeholder="V1"
                value={product.productVersion ?? ""}
                onChange={handleVersionChange}
                style={versionInputStyle}
            />

            <select
                className="form-control"
                value={product.importance}
                onChange={handleImportanceChange}
                style={importanceSelectStyle}
            >
                {importanceOptions.map((opt) => (
                    <option key={opt} value={opt} style={importanceOptionStyle}>
                        {opt}
                    </option>
                ))}
            </select>

            <div className="d-flex gap-2" style={actionsStyle}>
                <label
                    title="Upload a PDF"
                    className="dashboard-btn--icon mb-0"
                    style={{ cursor: isUploading ? "wait" : "pointer" }}
                >
                    <input
                        type="file"
                        accept="application/pdf"
                        hidden
                        disabled={isUploading}
                        onChange={handleUpload}
                    />
                    {isUploading ? (
                        <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                        />
                    ) : (
                        <MdOutlineUploadFile />
                    )}
                </label>

                <button
                    type="button"
                    title="Delete the product"
                    onClick={handleDelete}
                    className="dashboard-btn--icon-danger"
                >
                    <MdOutlineDeleteForever />
                </button>
            </div>
        </div>
    );
});
ProductRow.displayName = "ProductRow";

const CountriesSelector: React.FC<Props> = ({ continent, setContinent, notify }) => {
    const editMode = continent._id !== null && continent._id !== undefined;
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const products = continent.productObjects ?? EMPTY_PRODUCTS;

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

    const handleSelect = useCallback((selectedOption: { label: string; value: string } | null) => {
        if (!selectedOption) return;

        const countryProduct: Product = {
            fileId: "",
            name: selectedOption.label,
            code: selectedOption.value,
            productVersion: null,
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
    }, [continent._id, setContinent]);

    // The row passes its own product id, so this handler doesn't depend on the
    // product list and keeps a stable identity while products are edited.
    const handleDelete = useCallback(async (index: number, productId?: string) => {
        if (editMode) {
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
    }, [editMode, setContinent]);

    const handleProductChange = useCallback<ProductChangeHandler>((index, key, value) => {
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
    }, [setContinent]);

    // Upload a PDF to file_storage and store the returned file id in the product's File ID.
    const handleUploadPdf = useCallback(async (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-selecting the same file later
        if (!file) return;

        if (file.type !== "application/pdf") {
            notify?.({ type: "error", message: "Please select a PDF file." });
            return;
        }

        try {
            setUploadingIndex(index);
            const formData = new FormData();
            formData.append("file", file);

            // Dedicated PDF endpoint: saves under the original filename and returns
            // the file id (filename without extension) to assign to the product.
            const { data } = await axiosInstance.post("/files/pdf", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const fileId = data?.data?.fileId;
            if (!fileId) {
                notify?.({ type: "error", message: "Upload failed: no file id returned." });
                return;
            }


            // Store the new file id and stamp the upload time.
            setContinent((prev) => {
                const updatedProducts = [...(prev.productObjects ?? [])];
                updatedProducts[index] = {
                    ...updatedProducts[index],
                    fileId,
                    fileUpload_timeStamp: Date.now(),
                };
                return { ...prev, productObjects: updatedProducts };
            });
            notify?.({ type: "success", message: "PDF uploaded successfully." });
        } catch (err: any) {
            console.error("Failed to upload PDF", err);
            notify?.({ type: "error", message: err?.message || "Failed to upload PDF." });
        } finally {
            setUploadingIndex(null);
        }
    }, [notify, setContinent]);

    return (
        <div style={{ color: "var(--txt)" }}>
            <div className="col-lg-3 col-12">
                <label className="form-label" style={headerTextStyle}>
                    Countries
                </label>

                <Select
                    options={countryOptions}
                    onChange={handleSelect}
                    placeholder="Select country"
                    isSearchable
                    styles={reactSelectStyles}
                    theme={selectTheme}
                    filterOption={filterOption}
                />
            </div>

            <div>
                {products.length > 0 && (
                    <div
                        className="d-flex mt-3 mb-1 fw-bold align-items-center"
                        style={{ color: "var(--txt)" }}
                    >
                        <div style={{ width: "20%" }}>Name</div>
                        <div style={{ width: "10%" }}>Code</div>
                        <div style={{ width: "23%" }}>File ID</div>
                        <div style={{ width: "12%" }}>Version</div>
                        <div style={{ width: "12%" }}>Importance</div>
                        <div style={{ width: "23%" }}>Actions</div>
                    </div>
                )}

                {products.map((product, index) => (
                    <ProductRow
                        key={index}
                        product={product}
                        index={index}
                        isUploading={uploadingIndex === index}
                        onProductChange={handleProductChange}
                        onUploadPdf={handleUploadPdf}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
};

export default memo(CountriesSelector);
