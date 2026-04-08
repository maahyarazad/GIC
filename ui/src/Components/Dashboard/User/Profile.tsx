import React, { useEffect, useState, useCallback, useMemo } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid"; 
import axiosInstance from "../../../api/axiosInstance";
import { User, UpdateUserRequest } from '../../../../../src/types/user.types';
import { updateUser, getLogs } from '../../../api/user'
import { useToast } from "../../../providers/ToastContext";
import { FaCheck, FaTimes } from "react-icons/fa";
import { CiTimer } from "react-icons/ci";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useModal } from "@/Providers/ModalContext";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import LogsList from "./LogsList";
export const UserProfilesDataGrid = () => {
    const { show } = useToast();
    const { confirm } = useConfirm();
    
    const { openModal } = useModal();
    
    const handleViewLogs = async (id: string) => { 
        openModal({
                title: "User Change Logs",
                content: ( <LogsList userId={id} show={show}/>),
                cancelText: "Close",
                onCancel: () => console.log("Cancelled"),
            }); 
        };


    const columns: Column<User>[] = [
        {
            field: "_id",
            headerName: "ID",
            width: '13%',
        },
        {
            field: "phone",
            headerName: "Logs",
            width: '3%',
            sortable: true,
            filterable: false,
            renderCell: (params) => (
                <div style={{ display: "flex", justifyContent: "center", cursor: 'pointer' }} onClick={() => handleViewLogs(params._id)}>
                    <CiTimer style={{ color: "gray", fontSize: "18px" }} />
                </div>
            ),
        },
        {
            field: "name",
            headerName: "Name",
            sortable: true,
            filterable: true,
            width: '10%',
        },
        {
            field: "authorize",
            headerName: "Authorize",
            width: '5%',
            sortable: true,
            filterable: false,
            renderCell: (params) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    {params.authorize ? (
                        <FaCheck style={{ color: "green", fontSize: "18px" }} />
                    ) : (
                        <FaTimes style={{ color: "red", fontSize: "18px" }} />
                    )}
                </div>
            ),
        }
        ,
        {
            field: "email",
            headerName: "Email",
            sortable: true,
            filterable: true,
            width: '15%',
        },
        {
            field: "role",
            headerName: "Role",
            sortable: true,
            filterable: true,
            width: '5%',
        },
        {
            field: "avatar",
            headerName: "Avatar",
            renderCell: (row) =>
                row.avatar ? (
                    <img
                        src={row.avatar}
                        alt={row.name}
                        style={{ width: 40, height: 40, borderRadius: "50%" }}
                    />
                ) : (
                    "—"
                ),
            width: '5%',
        },
        {
            field: "createdAt",
            headerName: "Created At",
            sortable: true,
            width: '15%',
            renderCell: (row) =>
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
        },
        {
            headerName: "Actions",
            width: '15%',
            renderCell: (row) => (


                <div className={`${row.role !== 'admin' ? " " : "d-none"}`}>
                    <div className="btn-group" role="group" aria-label="Basic example">
                        <button className={`btn btn-sm dashboard-btn`}
                            disabled={row.authorize} onClick={() => toggleAuthorization(row)}>Authorize</button>
                        <button className={`btn btn-sm dashboard-btn`}
                            disabled={!row.authorize} onClick={() => toggleAuthorization(row)}>Unauthorize</button>
                    </div>

                    {/* <button className="ms-2 btn btn-sm dashboard-btn" onClick={() => onDelete(row)}>Send Reset Password Link</button> */}

                </div>
            ),
            sortable: false,
            filterable: false,
        }

    ];

    const [rows, setRows] = useState<User[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({
        page: 1,
        pageSize: 10,
    });
    const [sortModel, setSortModel] = useState<SortModel<User> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<User>[] | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    const fetchUserProfiles = useCallback(async () => {
        setLoading(true);
        try {

            const params = new URLSearchParams();

            // Map pagination: limit & skip
            params.append("limit", paginationModel.pageSize.toString());
            params.append("skip", ((paginationModel.page - 1) * paginationModel.pageSize).toString());

            // Map sort
            if (sortModel) {
                params.append("sortBy", String(sortModel.field));
                params.append("sortOrder", sortModel.sort);
            }

            // Add filter
            if (filterModel && filterModel.length > 0) {
                params.append("filters", JSON.stringify(filterModel));
            }

            const response = await axiosInstance.get("/users", { params });

            setRows(response.data.data.users);
            setRowCount(response.data.data.total);
        } catch (err) {
            console.error("Failed to fetch user profiles", err);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel]);



    const debouncedFetch = useMemo(() => debounce(fetchUserProfiles, 400), [fetchUserProfiles]);


    useEffect(() => {
        debouncedFetch();

        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);


    const _toggle = async (row) => {
        try {

            const payload: UpdateUserRequest = {
                name: row.email,
                email: row.email,
                authorize: !row.authorize,
            };


            const response = await updateUser(row._id, payload);

            if (response.success) {
                show({ type: "success", message: response.message });
                fetchUserProfiles();
            }
        } catch (err: any) {
            show({
                type: "error",
                message: err.message,

            });
        } finally {

        }
    }

    const toggleAuthorization = async (row) => {

        if (!row.authorize) {
            const isConfirmed = await confirm({
                title: "Activate User",
                message: `Are you sure you want to activate the user "${row.name}"? This will send an activation email to the user.`,
                confirmText: "Activate",
                cancelText: "Cancel",
            });

            if (!isConfirmed) return;
            await _toggle(row);
        } else {
            await _toggle(row);
        }
    };


    return (
        <>
            <h3 className="mb">User Profiles</h3>
            {loading ?
                <Loader/>

             : 
                <GenericDataGrid<User>
                    rows={rows}
                    columns={columns}
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={setSortModel}
                    filterModel={filterModel}
                    onFilterModelChange={setFilterModel}
                    prevButtonClassName="dashboard-btn--ghost-minimal"
                    nextButtonClassName="dashboard-btn--ghost-minimal"
                    getRowId={(row) => row._id!.toString()}
                />
             }
        </>
    );
};
