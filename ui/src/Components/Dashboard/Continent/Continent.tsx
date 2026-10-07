import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../Providers/ToastContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import { ContinetViewModel } from '../../../../../src/types/continent.types'
import { useSlideMenu } from "@/Providers/SlideMenuProvider";
import ModifyContinent from "./ModifyContinent";
import DataPackageDialog from "./DataPackageDialog";
import { FaCheck, FaTimes } from "react-icons/fa";

// Shared, never-mutated defaults: module scope keeps one identity across renders.
const EMPTY_CONTINENT: ContinetViewModel = {
    name: "",
    slug: "",
    description: "",
    products: [],
    productObjects: [],
    parent: null,
    children: [],
    isActive: true,
    order: 0,
};

const getRowId = (row: ContinetViewModel) => row._id!;

// Send only the fields the API accepts. In particular, drop each
// product's heavy `metadata` and any read-only fields (createdAt, etc.)
// — they aren't editable here and bloat/invalidate the request.
const toContinentPayload = (continent: ContinetViewModel) => ({
    name: continent.name,
    slug: continent.slug,
    code: continent.code ?? null,
    description: continent.description ?? null,
    parent: continent.parent,
    children: continent.children,
    isActive: continent.isActive,
    order: continent.order,
    image: continent.image ?? null,
    imageAlt: continent.imageAlt ?? null,
    seoTitle: continent.seoTitle ?? null,
    seoDescription: continent.seoDescription ?? null,
    seoKeywords: continent.seoKeywords ?? null,
    productObjects: (continent.productObjects ?? []).map((p: any) => ({
        ...(p._id ? { _id: p._id } : {}),
        fileId: p.fileId,
        name: p.name,
        code: p.code,
        importance: p.importance,
        productVersion: p.productVersion ?? null,
        fileUpload_timeStamp: p.fileUpload_timeStamp ?? null,
        content: p.content ?? null,
        variant: p.variant ?? null,
        media: p.media ?? null,
        tags: p.tags ?? null,
        downloadCount: p.downloadCount ?? 0,
        children: p.children ?? [],
        recommended: p.recommended ?? [],
    })),
});

const CategoriesDataGrid = () => {
    const { show } = useToast();
    const { confirm } = useConfirm();
    const { openMenu, onClose } = useSlideMenu();

    const [rows, setRows] = useState<ContinetViewModel[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 });
    const [sortModel, setSortModel] = useState<SortModel<ContinetViewModel> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<ContinetViewModel>[] | null>(null);
    const [loading, setLoading] = useState(true);





    const fetchCategories = useCallback(async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append("limit", paginationModel.pageSize.toString());
            params.append("skip", ((paginationModel.page - 1) * paginationModel.pageSize).toString());

            if (sortModel) {
                params.append("sortBy", String(sortModel.field));
                params.append("sortOrder", sortModel.sort);
            }

            if (filterModel && filterModel.length > 0) {
                params.append("filters", JSON.stringify(filterModel));
            }

            const { data } = await axiosInstance.get("/continents", { params });


            setRows(data?.data?.continents ?? []);
            setRowCount(data?.total ?? data?.data?.continents?.length ?? 0);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel]);

    // Latest fetch without making callers depend on paging/sort/filter state, so the
    // handlers below keep a stable identity and never refresh with stale params.
    const fetchCategoriesRef = useRef(fetchCategories);
    fetchCategoriesRef.current = fetchCategories;
    const refreshCategories = useCallback(() => fetchCategoriesRef.current(), []);

    const debouncedFetch = useMemo(() => debounce(fetchCategories, 400), [fetchCategories]);

    useEffect(() => {
        debouncedFetch();
        return () => debouncedFetch.cancel();
    }, [debouncedFetch]);


    const onDelete = useCallback(async (row: ContinetViewModel) => {
        const isConfirmed = await confirm({
            title: "Delete ContinetViewModel",
            message: `Are you sure you want to delete "${row.name}"?`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (!isConfirmed) return;

        try {

            await axiosInstance.delete(`/continents/${row._id}`);
            show({ type: "success", message: "ContinetViewModel deleted successfully" });
            refreshCategories();
        } catch (err: any) {
            show({ type: "error", message: err.message || "Failed to delete ContinetViewModel" });
        }
    }, [confirm, show, refreshCategories]);


    const [id, setId] = useState<string | null>(null);
    const [headerTitle, setHeaderTitle] = useState<string | null>(null);

    const [open, setOpen] = useState(false);
    const [continent, setContinent] = useState<ContinetViewModel>(EMPTY_CONTINENT);


    const onCreate = useCallback(() => {
        setHeaderTitle("New ContinetViewModel");
        setId(null);
        setContinent({
            ...EMPTY_CONTINENT,
            isActive: true, // default active
        });
        setOpen(true);
    }, []);
    // Picking the dataset is the admin's call, so the button opens the picker rather
    // than seeding straight away.
    const [dataPackageDialogOpen, setDataPackageDialogOpen] = useState(false);
    const handleInitializeDb = useCallback(() => setDataPackageDialogOpen(true), []);
    const closeDataPackageDialog = useCallback(() => setDataPackageDialogOpen(false), []);

    const onEdit = useCallback((row: ContinetViewModel) => {
        setHeaderTitle(`Modify ${row.name}`);
        setId(row._id!);
        setContinent({ ...row }); // create a new object reference
        setOpen(true);
    }, []);

    const columns = useMemo<Column<ContinetViewModel>[]>(() => [
        { field: "_id", headerName: "ID", width: "10%" },
        { field: "name", headerName: "Name", sortable: true, filterable: true, width: "15%" },
        { field: "slug", headerName: "Slug", sortable: true, filterable: true, width: "15%" },
        {
            field: "parent",
            headerName: "Parent",
            width: "10%",
            renderCell: row => row.parent ?? "—"
        },
        {
            field: "isActive",
            headerName: "Active",
            width: "8%",
            renderCell: (params) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    {params.isActive ? (
                        <FaCheck style={{ color: "green", fontSize: "18px" }} />
                    ) : (
                        <FaTimes style={{ color: "red", fontSize: "18px" }} />
                    )}
                </div>
            ),
        },
        {
            field: "order",
            headerName: "Order",
            width: "8%"
        },
        {
            field: "createdAt",
            headerName: "Created At",
            width: "12%",
            renderCell: row => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"
        },
        {
            headerName: "Actions",
            width: "20%",
            renderCell: (row) => (
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        title="Edit"
                        className="dashboard-btn--ghost-minimal"
                        onClick={() => onEdit(row)}
                    >
                        Edit
                    </button>

                    <button
                        title="Delete"
                        className="dashboard-btn--delete-ghost"
                        onClick={() => onDelete(row)}
                    >
                        Delete
                    </button>
                </div>
            ),
            sortable: false,
            filterable: false,
        }
    ], [onEdit, onDelete]);

    const resetState = useCallback(() => {
        setId(null);
        setHeaderTitle(null);
        setContinent(EMPTY_CONTINENT);
        setOpen(false);
    }, []);

    const handleSaveContinent = useCallback(async (continent: ContinetViewModel) => {
        try {
            const editMode = (continent._id !== null && continent._id !== undefined);

            const payload = toContinentPayload(continent);

            if (editMode) {

                await axiosInstance.put(`/continents/${continent._id}`, payload);
                show({ type: "success", message: "ContinetViewModel updated!" });
            } else {

                await axiosInstance.post("/continents", payload);
                show({ type: "success", message: "ContinetViewModel created!" });
            }

            // Reset form / state and reload
            resetState();
            refreshCategories();
        } catch (err: any) {
            console.error(err);
            show({
                type: "error",
                message: err.response?.data?.message || "Failed to save continent",
            });
        }
    }, [show, resetState, refreshCategories]);



    useEffect(() => {
        if (open) {
            openMenu(
                <ModifyContinent
                    id={id}
                    continent={continent}
                    setContinent={setContinent}
                    handleSaveContinent={handleSaveContinent}
                    notify={show}
                />

            );
        } else { onClose(); }
    }, [open, id, continent, headerTitle, openMenu, onClose, handleSaveContinent, show]);




    return (
        <div className="dash-section">
            <div className="dash-header">
                <h3>Manage Country Intelligence</h3>
                <div className="d-flex gap-2">
                    <button
                        className="dashboard-btn"
                        style={{ minWidth: 94 }}
                        onClick={handleInitializeDb}
                    >
                        Initialize Db
                    </button>
                    <button className="dashboard-btn" onClick={onCreate}>
                        Add New
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <GenericDataGrid<ContinetViewModel>
                    prevButtonClassName="dashboard-btn--ghost-minimal"
                    nextButtonClassName="dashboard-btn--ghost-minimal"
                    rows={rows}
                    columns={columns}
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={setSortModel}
                    filterModel={filterModel}
                    onFilterModelChange={setFilterModel}
                    getRowId={getRowId}
                />
            )}

            {dataPackageDialogOpen && (
                <DataPackageDialog
                    onClose={closeDataPackageDialog}
                    onImported={refreshCategories}
                />
            )}
        </div>
    );
};

export default CategoriesDataGrid;
