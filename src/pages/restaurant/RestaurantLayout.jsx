import { Outlet } from "react-router-dom";
import RestaurantSidebar from "../../components/RestaurantSidebar";
import "../../styles/restaurant-dashboard.css";

function RestaurantLayout() {
  console.log('RestaurantLayout rendered');
  return (
    <div className="rh-root">
      <RestaurantSidebar />
      <main className="rh-main">
        <Outlet />
      </main>
    </div>
  );
}

export default RestaurantLayout;
