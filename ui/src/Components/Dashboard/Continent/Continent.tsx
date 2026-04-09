import React, { useEffect, useState, useCallback, useMemo } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../providers/ToastContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import { ContinetViewModel } from '../../../../../src/types/continent.types'
import { useSlideMenu } from "@/Providers/SlideMenuProvider";
import ModifyContinent from "./ModifyContinent";
import { FaCheck, FaTimes } from "react-icons/fa";

const buttonGroupStyle = { fontSize: 14, padding: 5 };

const CategoriesDataGrid = () => {
    const { show } = useToast();
    const { confirm } = useConfirm();
    const { openMenu, onClose } = useSlideMenu();

    const columns: Column<ContinetViewModel>[] = [
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
                <div className="btn-group">
                    <button
                    title="Edit"
                        style={buttonGroupStyle}
                        className="btn btn-sm dashboard-btn"
                        onClick={() => onEdit(row)}
                    >
                        Edit
                    </button>

                    <button
                     title="Delete"
                        style={buttonGroupStyle}
                        className="btn btn-sm dashboard-btn--delete-ghost"
                        onClick={() => onDelete(row)}
                    >
                        Delete
                    </button>
                </div>
            ),
            sortable: false,
            filterable: false,
        }
    ];

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

    const debouncedFetch = useMemo(() => debounce(fetchCategories, 400), [fetchCategories]);

    useEffect(() => {
        debouncedFetch();
        return () => debouncedFetch.cancel();
    }, [debouncedFetch]);


    const onDelete = async (row: ContinetViewModel) => {
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
            fetchCategories();
        } catch (err: any) {
            show({ type: "error", message: err.message || "Failed to delete ContinetViewModel" });
        }
    };


    const emptyContinent: ContinetViewModel = {
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

    const [id, setId] = useState<string | null>(null);
    const [headerTitle, setHeaderTitle] = useState<string | null>(null);

    const [open, setOpen] = useState(false);
    const [continent, setContinent] = useState<ContinetViewModel>(emptyContinent);


    const onCreate = () => {
        setHeaderTitle("New ContinetViewModel");
        setId(null);
        setContinent({
            ...emptyContinent,
            isActive: true, // default active
        });
        setOpen(true);
    };

    const onEdit = (row: ContinetViewModel) => {
        setHeaderTitle(`Modify ${row.name}`);
        setId(row._id!);
        setContinent({ ...row }); // create a new object reference
        setOpen(true);
    };

    const resetState = () => {

        setId(null);
        setHeaderTitle(null);
        setContinent(emptyContinent);
        setOpen(false);
    }

    const handleSaveContinent = async (continent: ContinetViewModel) => {
        try {
            const editMode = (continent._id !== null && continent._id !== undefined);
            if (editMode) {
            
                await axiosInstance.post(`/continents/update`, continent);
                show({ type: "success", message: "ContinetViewModel updated!" });
            } else {
               
                await axiosInstance.post("/continents", continent);
                show({ type: "success", message: "ContinetViewModel created!" });
            }

            // Reset form / state and reload
            resetState();
            fetchCategories();
        } catch (err: any) {
            console.error(err);
            show({
                type: "error",
                message: err.response?.data?.message || "Failed to save continent",
            });
        }
    };



    useEffect(() => {
        if (open) {
            openMenu(
                <ModifyContinent
                    id={id}
                    continent={continent}
                    setContinent={setContinent}
                    handleSaveContinent={handleSaveContinent}
                />

            );
        } else { onClose(); }
    }, [open, id, continent, headerTitle]);




    return (
        <>
            <h3 className="mb">Manage Continents</h3>

            <button className={`btn btn-sm dashboard-btn mb-1`}
                onClick={onCreate}>
                Add New</button>
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
                    getRowId={(row) => row._id!}
                />
            )}
        </>
    );
};

export default CategoriesDataGrid;
