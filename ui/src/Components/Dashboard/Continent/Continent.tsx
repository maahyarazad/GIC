import React, { useEffect, useState, useCallback, useMemo } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../providers/ToastContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import { Continent } from '../../../../../src/types/continent.types'
import { useSlideMenu } from "@/Providers/SlideMenuProvider";
import ModifyContinent from "./ModifyContinent";


const buttonGroupStyle = { fontSize: 10, padding: 5 };

const CategoriesDataGrid = () => {
    const { show } = useToast();
    const { confirm } = useConfirm();
    const { openMenu , onClose} = useSlideMenu();

    const columns: Column<Continent>[] = [
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
            renderCell: row => row.isActive ? "Yes" : "No"
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
                        style={buttonGroupStyle}
                        className="btn btn-sm dashboard-btn"
                        onClick={() => onEdit(row)}
                    >
                        Edit
                    </button>

                    <button
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

    const [rows, setRows] = useState<Continent[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 });
    const [sortModel, setSortModel] = useState<SortModel<Continent> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<Continent>[] | null>(null);
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

            const response = await axiosInstance.get("/continents", { params });

            setRows(response.data.data.categories);
            setRowCount(response.data.total ?? response.data.data.categories.length);
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


    const onDelete = async (row: Continent) => {
        const isConfirmed = await confirm({
            title: "Delete Continent",
            message: `Are you sure you want to delete "${row.name}"?`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (!isConfirmed) return;

        try {
            debugger;
            await axiosInstance.delete(`/continents/${row._id}`);
            show({ type: "success", message: "Continent deleted successfully" });
            fetchCategories();
        } catch (err: any) {
            show({ type: "error", message: err.message || "Failed to delete Continent" });
        }
    };


    const emptyContinent: Continent = {
        name: "",
        slug: "",
        description: "",
        products: [],
        parent: null,
        children: [],
        isActive: true,
        order: 0,
    };

    const [id, setId] = useState<string | null>(null);
    const [headerTitle, setHeaderTitle] = useState<string | null>(null);

    const [open, setOpen] = useState(false);
    const [continent, setContinent] = useState<Continent>(emptyContinent);


    const onCreate = () => {
        setHeaderTitle("New Continent");
        setId(null);
        setContinent({
            ...emptyContinent,
            isActive: true, // default active
        });
        setOpen(true);
    };

        const onEdit = (row: Continent) => {
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

    const handleSaveContinent = async (continent: Continent) => {
        try {
            const payload = {
                name: continent.name,
                slug: continent.slug,
                description: continent.description ?? null,
                parent: continent.parent ?? null,
                children: continent.children ?? null,
                products: continent.products ?? [],
                isActive: continent.isActive ?? true,
                order: Number(continent.order) || 0,
            };

            
            if (continent._id) {
                
                await axiosInstance.put(`/continents/${continent._id}`, payload);
                show({ type: "success", message: "Continent updated!" });
            } else {
                await axiosInstance.post("/continents", payload);
                show({ type: "success", message: "Continent created!" });
            }

           resetState();
            fetchCategories(); 
        } catch (err: any) {
            
            show({
                type: "error",
                message: err.error?.message || "Failed to save continent",
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
        }else {onClose();}
    }, [open, id, continent, headerTitle]);


// useEffect(()=>{
//     debugger;
//      setOpen(false);
//         setHeaderTitle(null);
//         setId(null);
//         setContinent(emptyContinent);
// }, [onClose])

    return (
        <>
            <h3 className="mb-3">Manage Continents</h3>

            <button className={`btn btn-sm dashboard-btn mb-1`}
                onClick={onCreate}>
                Add New</button>
            {loading ? (
                <Loader />
            ) : (
                <GenericDataGrid<Continent>
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
