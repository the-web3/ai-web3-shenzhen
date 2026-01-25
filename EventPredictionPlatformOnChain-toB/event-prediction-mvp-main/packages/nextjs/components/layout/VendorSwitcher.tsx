"use client";

import { useAuth } from "~~/hooks/useAuth";

export function VendorSwitcher() {
  const { activeVendor, joinedVendors, setActiveVendor, hasJoinedVendors } = useAuth();

  if (!hasJoinedVendors) {
    return null;
  }

  const handleVendorChange = (vendorId: number) => {
    setActiveVendor(vendorId);
    // Optionally refresh the page to reload data
    window.location.reload();
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-8">
            <span className="text-sm">{activeVendor?.vendor_name?.charAt(0) || "?"}</span>
          </div>
        </div>
        <span className="hidden sm:inline">{activeVendor?.vendor_name || "Select Dapp"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2">
        <li className="menu-title">
          <span>Your Dapps</span>
        </li>
        {joinedVendors.map(jv => (
          <li key={jv.vendor_id}>
            <button
              className={`${jv.vendor_id === activeVendor?.vendor_id ? "active" : ""}`}
              onClick={() => handleVendorChange(jv.vendor_id)}
            >
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-6">
                  <span className="text-xs">{jv.vendors.vendor_name.charAt(0)}</span>
                </div>
              </div>
              {jv.vendors.vendor_name}
              {jv.vendor_id === activeVendor?.vendor_id && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 ml-auto"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
