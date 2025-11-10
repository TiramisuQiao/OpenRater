"""重置数据库脚本 - 删除所有表并重新创建"""
import os
from app.database import Base, engine

def reset_database():
    print("正在删除所有数据库表...")
    Base.metadata.drop_all(bind=engine)
    print("正在创建新的数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库重置完成！")
    print("\n请运行 'python -m app.initial_data' 创建管理员账号")

if __name__ == "__main__":
    confirm = input("警告：此操作将删除所有数据！确认继续？(yes/no): ")
    if confirm.lower() == "yes":
        reset_database()
    else:
        print("操作已取消")
