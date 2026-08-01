const LoginHistory =
  require("../models/LoginHistory");

exports.getLoginHistory =
  async (req, res) => {

    try {

      const history =
        await LoginHistory.find({

          user: req.user.id,

        }).sort({

          createdAt: -1,

        });

      res.json({

        success: true,

        data: history,

      });

    } catch (err) {

      res.status(500).json({

        success: false,

        message: err.message,

      });

    }

  };