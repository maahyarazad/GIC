import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Continent } from "../../../../../src/types/continent.types";
import slugify from "slugify";

interface ModifyContinentProps {
  continent?: Continent;
  handleSaveContinent: (continent: Continent) => void;
}

export interface ModifyContinentRef {
  submitForm: () => void;
}

const ModifyContinent = forwardRef<
  ModifyContinentRef,
  ModifyContinentProps
>(({ continent, handleSaveContinent }, ref) => {
  const formRef = useRef<HTMLFormElement>(null);

  const [formState, setFormState] = useState<Continent>({
    name: "",
    slug: "",
    description: "",
    products: [],
    parent: 'root',
    children: [],
    isActive: true,
    order: 0,
  });

useEffect(() => {
  if (continent) {
    setFormState((prev) => ({
      ...continent,
      slug: slugify(continent.name, {
        lower: true,   
        strict: true,  
        locale: "en",
      }),
    }));
  }
}, [continent]);

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      formRef.current?.requestSubmit();
    },
  }));

const handleChange = <K extends keyof Continent>(key: K, value: Continent[K]) => {
  setFormState((prev) => ({
    ...prev,
    [key]: value,
    ...(key === "name" && {
      slug: slugify(String(value), {
        lower: true,
        strict: true,
        locale: "en",
      }),
    }),
  }));
};


  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    handleSaveContinent(formState);
  };

  return (
  <form
  ref={formRef}
  onSubmit={onSubmit}
  className="d-flex flex-column gap-3"
>
  <button
    type="submit"
    className="btn dashboard-btn align-self-start"
    disabled={!formState.name || !formState.slug}
  >
    Save
  </button>

  <div className="row g-3">

    {/* Name */}
    <div className="col-12 col-lg-6">
      <label className="form-label fw-bold">Name *</label>
      <input
        type="text"
        className="form-control"
        value={formState.name}
        onChange={(e) => handleChange("name", e.target.value)}
        required
      />
    </div>

    {/* Slug */}
    <div className="col-12 col-lg-6">
      <label className="form-label fw-bold">Slug *</label>
      <input
        type="text" disabled={true}
        className="form-control"
        value={formState.slug}
        onChange={(e) => handleChange("slug", e.target.value)}
        required
      />
    </div>

    {/* Description */}
    <div className="col-12">
      <label className="form-label fw-bold">Description</label>
      <textarea
        className="form-control"
        rows={3}
        value={formState.description}
        onChange={(e) =>
          handleChange("description", e.target.value)
        }
      />
    </div>

    {/* Parent */}
    <div className="col-12 col-lg-6">
      <label className="form-label fw-bold">Parent ID</label>
      <input
        type="text"
        disabled
        className="form-control"
        value={formState.parent ?? ""}
        onChange={(e) =>
          handleChange("parent", e.target.value || null)
        }
      />
    </div>

    {/* Order */}
    <div className="col-12 col-lg-6">
      <label className="form-label fw-bold">Order</label>
      <input
        type="number"
        className="form-control"
        value={formState.order}
        onChange={(e) =>
          handleChange("order", Number(e.target.value))
        }
      />
    </div>

    {/* Active */}
    <div className="col-12">
      <div className="form-check mt-2">
        <input
          type="checkbox"
          className="form-check-input"
          checked={formState.isActive}
          onChange={(e) =>
            handleChange("isActive", e.target.checked)
          }
        />
        <label className="form-check-label">
          Active
        </label>
      </div>
    </div>

  </div>
</form>

  );
});

export default ModifyContinent;
