import { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/users/profile",
          {
            withCredentials: true, // IMPORTANT for cookies
          }
        );

        setUser(res.data.data);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);
  const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fa",
  },
  card: {
    width: "420px",
    background: "#fff",
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  heading: {
    marginBottom: "20px",
    textAlign: "center",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px",
  },
};


  if (loading) {
    return <div style={styles.center}>Loading profile...</div>;
  }

  if (error) {
    return <div style={{ ...styles.center, color: "red" }}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>👤 My Profile</h2>

        <div style={styles.row}>
          <span>Name</span>
          <span>{user.name}</span>
        </div>

        <div style={styles.row}>
          <span>Email</span>
          <span>{user.email}</span>
        </div>

        <div style={styles.row}>
          <span>Phone</span>
          <span>{user.phone || "N/A"}</span>
        </div>

        <div style={styles.row}>
          <span>Role</span>
          <span>{user.role}</span>
        </div>

        <div style={styles.row}>
          <span>Joined</span>
          <span>{new Date(user.createdAt).toDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
